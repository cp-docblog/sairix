/*
  # Create interaction_needed table

  1. New Tables
    - `interaction_needed`
      - `id` (uuid, primary key)
      - `wa_id` (numeric, unique)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on interaction_needed table
    - Add policies for authenticated users to read and modify data
*/

CREATE TABLE IF NOT EXISTS interaction_needed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wa_id numeric UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE interaction_needed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read interaction needed"
  ON interaction_needed
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert interaction needed"
  ON interaction_needed
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete interaction needed"
  ON interaction_needed
  FOR DELETE
  TO authenticated
  USING (true);