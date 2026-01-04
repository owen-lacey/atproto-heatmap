-- AT Proto Handle Lookup - Database Schema
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create handles table
CREATE TABLE IF NOT EXISTS handles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  handle TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'hydrating', 'complete', 'error')),
  at_proto_data JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create records table
CREATE TABLE IF NOT EXISTS records (
  id BIGSERIAL PRIMARY KEY,
  handle_id UUID NOT NULL REFERENCES handles(id) ON DELETE CASCADE,
  collection TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_handles_handle ON handles(handle);
CREATE INDEX IF NOT EXISTS idx_handles_status ON handles(status);
CREATE INDEX IF NOT EXISTS idx_records_handle_id ON records(handle_id);
CREATE INDEX IF NOT EXISTS idx_records_timestamp ON records(handle_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_records_collection ON records(collection);
CREATE INDEX IF NOT EXISTS idx_records_handle_collection_timestamp ON records(handle_id, collection, timestamp);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for handles table
DROP TRIGGER IF EXISTS update_handles_updated_at ON handles;
CREATE TRIGGER update_handles_updated_at
  BEFORE UPDATE ON handles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE handles ENABLE ROW LEVEL SECURITY;
ALTER TABLE records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for handles table
-- Public read access
CREATE POLICY "Allow public read access on handles"
  ON handles
  FOR SELECT
  TO public
  USING (true);

-- Service role full access
CREATE POLICY "Allow service role full access on handles"
  ON handles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for records table
-- Public read access
CREATE POLICY "Allow public read access on records"
  ON records
  FOR SELECT
  TO public
  USING (true);

-- Service role full access
CREATE POLICY "Allow service role full access on records"
  ON records
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Optional: Create database functions for aggregations

-- Function to get daily record counts
CREATE OR REPLACE FUNCTION get_daily_counts(
  p_handle_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 year'
)
RETURNS TABLE(date DATE, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    timestamp::DATE as date,
    COUNT(*) as count
  FROM records
  WHERE handle_id = p_handle_id
    AND timestamp::DATE >= p_start_date
  GROUP BY timestamp::DATE
  ORDER BY timestamp::DATE;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get collection totals
CREATE OR REPLACE FUNCTION get_collection_totals(p_handle_id UUID)
RETURNS TABLE(collection TEXT, total BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.collection,
    COUNT(*) as total
  FROM records r
  WHERE r.handle_id = p_handle_id
  GROUP BY r.collection
  ORDER BY total DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE handles;
ALTER PUBLICATION supabase_realtime ADD TABLE records;

-- Grant usage on sequences
GRANT USAGE, SELECT ON SEQUENCE records_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE records_id_seq TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database schema created successfully!';
  RAISE NOTICE 'Tables: handles, records';
  RAISE NOTICE 'RLS policies enabled';
  RAISE NOTICE 'Realtime enabled';
  RAISE NOTICE 'Indexes created for optimal performance';
END $$;
