/*
  # Add campaign data and status

  1. New Tables
    - `campaign_data`
      - `id` (uuid, primary key)
      - `campaign_id` (uuid, foreign key)
      - `name` (text)
      - `contact_info` (text)
      - `message` (text)
      - `created_at` (timestamptz)

  2. Changes
    - Add `status` column to campaigns table
    - Add foreign key constraint to campaign_data

  3. Security
    - Enable RLS on campaign_data table
    - Add policies for authenticated users
*/

-- Add status column to campaigns table
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'Awaiting Confirmation';

-- Create campaign_data table
CREATE TABLE IF NOT EXISTS campaign_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_info text NOT NULL,
  message text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE campaign_data ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read campaign data"
  ON campaign_data
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert campaign data"
  ON campaign_data
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_campaign_data_campaign_id ON campaign_data(campaign_id);