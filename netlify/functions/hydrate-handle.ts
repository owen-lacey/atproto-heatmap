import { createClient } from '@supabase/supabase-js';
import { Agent } from '@atproto/api';
import { IdResolver, getPds } from '@atproto/identity';
import { COLLECTIONS } from '../../lib/collections';

// Configuration
export const config = {
  type: 'background' as const,
};

// One year lookback limit
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const BATCH_SIZE = 1000;

interface Database {
  public: {
    Tables: {
      handles: {
        Row: {
          id: string;
          handle: string;
          status: 'pending' | 'hydrating' | 'complete' | 'error';
          at_proto_data: any;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      records: {
        Insert: {
          handle_id: string;
          collection: string;
          timestamp: string;
        };
      };
    };
  };
}

/**
 * Resolve handle to DID and get PDS agent
 */
async function getAgentForHandle(handle: string): Promise<{ agent: Agent; did: string }> {
  const resolver = new IdResolver();
  const did = await resolver.handle.resolve(handle);
  
  if (!did) {
    throw new Error(`Unable to resolve DID for handle: ${handle}`);
  }

  const didDoc = await resolver.did.resolve(did);
  if (!didDoc) {
    throw new Error(`Unable to resolve DID document for DID: ${did}`);
  }

  const pds = getPds(didDoc);
  if (!pds) {
    throw new Error(`No PDS found in DID document for DID: ${did}`);
  }

  const agent = new Agent(pds);
  return { agent, did };
}

/**
 * Fetch records from AT Proto with pagination
 */
async function fetchRecordsForCollection(
  agent: Agent,
  did: string,
  collection: string,
  timestampProperty: string,
  cutoffDate: Date
): Promise<Array<{ collection: string; timestamp: string }>> {
  const records: Array<{ collection: string; timestamp: string }> = [];
  let cursor: string | undefined;
  let shouldContinue = true;

  console.log(`Fetching ${collection} for ${did}...`);

  while (shouldContinue) {
    try {
      const response = await agent.com.atproto.repo.listRecords({
        repo: did,
        collection,
        limit: 100,
        cursor,
      });

      // Process records
      for (const record of response.data.records) {
        const value = record.value as any;
        const timestamp = value[timestampProperty];

        if (!timestamp) {
          continue;
        }

        const recordDate = new Date(timestamp);

        // Stop if we've gone back more than 1 year
        if (recordDate < cutoffDate) {
          shouldContinue = false;
          break;
        }

        records.push({
          collection,
          timestamp,
        });
      }

      // Check if there are more records
      cursor = response.data.cursor;
      if (!cursor) {
        shouldContinue = false;
      }

      console.log(`  Fetched ${records.length} records so far...`);
    } catch (error) {
      console.error(`Error fetching ${collection}:`, error);
      // Don't throw - continue with other collections
      break;
    }
  }

  console.log(`  Total ${collection} records: ${records.length}`);
  return records;
}

/**
 * Insert records in batches
 */
async function insertRecordsInBatches(
  supabase: ReturnType<typeof createClient<Database>>,
  handleId: string,
  records: Array<{ collection: string; timestamp: string }>
) {
  const batches = [];
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    batches.push(records.slice(i, i + BATCH_SIZE));
  }

  console.log(`Inserting ${records.length} records in ${batches.length} batches...`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const recordsToInsert = batch.map((r) => ({
      handle_id: handleId,
      collection: r.collection,
      timestamp: r.timestamp,
    }));

    const { error } = await supabase.from('records').insert(recordsToInsert);

    if (error) {
      console.error(`Error inserting batch ${i + 1}:`, error);
      throw error;
    }

    console.log(`  Inserted batch ${i + 1}/${batches.length}`);
  }

  console.log('All records inserted successfully');
}

/**
 * Main handler function
 */
export default async function handler(req: Request) {
  const startTime = Date.now();
  console.log('Hydration function started');

  try {
    // Parse request body
    const body = await req.json();
    const { recordId } = body;

    if (!recordId) {
      return new Response(JSON.stringify({ error: 'Missing recordId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing record ID: ${recordId}`);

    // Create Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Fetch handle record
    const { data: handleRecord, error: fetchError } = await supabase
      .from('handles')
      .select('*')
      .eq('id', recordId)
      .single();

    if (fetchError || !handleRecord) {
      console.error('Failed to fetch handle record:', fetchError);
      throw new Error('Handle record not found');
    }

    console.log(`Processing handle: ${handleRecord.handle}`);

    // Update status to hydrating
    await supabase
      .from('handles')
      .update({ status: 'hydrating' })
      .eq('id', recordId);

    // Get agent for handle
    const { agent, did } = await getAgentForHandle(handleRecord.handle);

    // Calculate cutoff date (1 year ago)
    const cutoffDate = new Date(Date.now() - ONE_YEAR_MS);
    console.log(`Cutoff date: ${cutoffDate.toISOString()}`);

    // Fetch records from all collections
    const allRecords: Array<{ collection: string; timestamp: string }> = [];

    for (const collectionConfig of COLLECTIONS) {
      try {
        const records = await fetchRecordsForCollection(
          agent,
          did,
          collectionConfig.collection,
          collectionConfig.timestampProperty,
          cutoffDate
        );
        allRecords.push(...records);
      } catch (error) {
        console.error(`Failed to fetch ${collectionConfig.collection}:`, error);
        // Continue with other collections
      }
    }

    console.log(`Total records fetched: ${allRecords.length}`);

    // Insert records in batches
    if (allRecords.length > 0) {
      await insertRecordsInBatches(supabase, recordId, allRecords);
    }

    // Mark as complete
    await supabase
      .from('handles')
      .update({ status: 'complete' })
      .eq('id', recordId);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Hydration completed in ${duration}s`);

    return new Response(
      JSON.stringify({
        success: true,
        recordCount: allRecords.length,
        duration: `${duration}s`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Hydration error:', error);

    // Try to update status to error
    try {
      const body = await req.json();
      const { recordId } = body;

      if (recordId) {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
          await supabase
            .from('handles')
            .update({
              status: 'error',
              error_message: error instanceof Error ? error.message : 'Unknown error',
            })
            .eq('id', recordId);
        }
      }
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration}s`,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
