import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Agent } from '@atproto/api';
import { COLLECTIONS } from '../../lib/collections';
import { getPdsAgent } from '@/lib/atproto';
import { Database, createServerClient } from '@/lib/supabase';
import type { Context } from '@netlify/functions';

// One year lookback limit
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const BATCH_SIZE = 1000;
/**
 * Fetch records from AT Proto with pagination
 */
async function fetchRecordsForCollection(
  agent: Agent,
  did: string,
  collection: string,
  timestampProperty: string,
  cutoffDate: Date,
  startDate?: Date
): Promise<Array<{ collection: string; timestamp: string }>> {
  const records: Array<{ collection: string; timestamp: string }> = [];
  let cursor: string | undefined;
  let shouldContinue = true;

  console.log(`Fetching ${collection} for ${did}...`);
  if (startDate) {
    console.log(`  Delta mode: fetching from ${startDate.toISOString()} onwards`);
  }

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

        // For delta updates, only include records newer than startDate
        if (startDate && recordDate < startDate) {
          continue;
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
 * Insert records in batches with deduplication
 */
async function insertRecordsInBatches(
  supabase: SupabaseClient<Database>,
  handleId: string,
  records: Array<{ collection: string; timestamp: string }>
) {
  const batches = [];
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    batches.push(records.slice(i, i + BATCH_SIZE));
  }

  console.log(`Inserting ${records.length} records in ${batches.length} batches...`);

  let insertedCount = 0;
  let duplicateCount = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const recordsToInsert = batch.map((r) => ({
      handle_id: handleId,
      collection: r.collection,
      timestamp: r.timestamp,
    }));

    // Create unique composite keys for deduplication
    const uniqueKeys = new Set<string>();
    const deduplicatedRecords = recordsToInsert.filter((r) => {
      const key = `${r.handle_id}:${r.collection}:${r.timestamp}`;
      if (uniqueKeys.has(key)) {
        duplicateCount++;
        return false;
      }
      uniqueKeys.add(key);
      return true;
    });

    if (deduplicatedRecords.length === 0) {
      console.log(`  Batch ${i + 1}/${batches.length}: All duplicates, skipping`);
      continue;
    }

    const { error } = await supabase
      .from('records')
      .insert(deduplicatedRecords)
      .select();

    if (error) {
      // Check if error is due to unique constraint violation
      if (error.code === '23505') {
        console.log(`  Batch ${i + 1}/${batches.length}: Contains duplicates, attempting individual inserts`);
        // Try inserting records one by one to skip duplicates
        for (const record of deduplicatedRecords) {
          const { error: singleError } = await supabase.from('records').insert(record);
          if (singleError && singleError.code !== '23505') {
            console.error(`Error inserting record:`, singleError);
          } else if (!singleError) {
            insertedCount++;
          } else {
            duplicateCount++;
          }
        }
      } else {
        console.error(`Error inserting batch ${i + 1}:`, error);
        throw error;
      }
    } else {
      insertedCount += deduplicatedRecords.length;
      console.log(`  Inserted batch ${i + 1}/${batches.length}`);
    }
  }

  console.log(`Records inserted: ${insertedCount}, Duplicates skipped: ${duplicateCount}`);
}

/**
 * Background function - runs up to 15 minutes, returns 202 immediately
 */
export default async function (req: Request, context: Context) {
  const startTime = Date.now();
  console.log('Hydration function started');

  try {
    // Parse request body
    const body = await req.json();
    const { recordId, deltaMode } = body;

    if (!recordId) {
      return new Response(JSON.stringify({ error: 'Missing recordId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing record ID: ${recordId}${deltaMode ? ' (delta mode)' : ''}`);

    // Create Supabase client
    const supabase = createServerClient();

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

    // Determine start date for delta updates
    let startDate: Date | undefined;
    if (deltaMode && handleRecord.updated_at) {
      startDate = new Date(handleRecord.updated_at);
      console.log(`Delta mode: fetching records since ${startDate.toISOString()}`);
    }

    // Update status to hydrating
    await supabase
      .from('handles')
      .update({ status: 'hydrating' })
      .eq('id', recordId);

    // Get agent for handle
    const { agent, did } = await getPdsAgent(handleRecord.handle);

    // Calculate cutoff date (1 year ago from start of today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cutoffDate = new Date(today.getTime() - ONE_YEAR_MS);
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
          cutoffDate,
          startDate
        );
        allRecords.push(...records);
      } catch (error) {
        console.error(`Failed to fetch ${collectionConfig.collection}:`, error);
        // Continue with other collections
      }
    }

    console.log(`Total records fetched: ${allRecords.length}`);

    // Filter out records from today when in delta mode
    // This ensures we only save complete days and don't miss posts from later in the day
    let recordsToSave = allRecords;
    if (deltaMode) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const originalCount = allRecords.length;
      recordsToSave = allRecords.filter((r) => {
        const recordDate = new Date(r.timestamp);
        return recordDate < todayStart;
      });

      console.log(`Delta mode: filtered out ${originalCount - recordsToSave.length} records from today`);
      console.log(`Records to save: ${recordsToSave.length}`);
    }

    // Insert records in batches
    if (recordsToSave.length > 0) {
      await insertRecordsInBatches(supabase, recordId, recordsToSave);
    }

    // Mark as complete and update timestamp
    // In delta mode, set updated_at to start of today to ensure we refetch today's posts next time
    const updateData: { status: string; updated_at?: string } = { status: 'complete' };
    if (deltaMode) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      updateData.updated_at = todayStart.toISOString();
    }

    await supabase
      .from('handles')
      .update(updateData)
      .eq('id', recordId);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Hydration completed in ${duration}s`);

    return new Response(
      JSON.stringify({
        success: true,
        recordCount: recordsToSave.length,
        recordsFetched: allRecords.length,
        mode: deltaMode ? 'delta' : 'full',
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
        try {
          const supabase = createServerClient();
          await supabase
            .from('handles')
            .update({
              status: 'error',
              error_message: error instanceof Error ? error.message : 'Unknown error',
            })
            .eq('id', recordId);
        } catch (updateError) {
          console.error('Failed to update error status:', updateError);
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
