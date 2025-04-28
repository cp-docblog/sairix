/*
  # Create campaigns table

  1. New Tables
    - `campaigns`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text)
      - `date_initiated` (timestamptz, default: now())
      - `contacts` (integer)
      - `created_at` (timestamptz, default: now())

  2. Security
    - Enable RLS on campaigns table
    - Add policies for authenticated users to read and create campaigns
*/

CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  date_initiated timestamptz DEFAULT now(),
  contacts integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read campaigns"
  ON campaigns
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create campaigns"
  ON campaigns
  FOR INSERT
  TO authenticated
  WITH CHECK (true);