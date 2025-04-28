/*
  # Create authentication schema

  1. Enable Row Level Security (RLS)
    - Enable RLS on all existing tables
    - Add policies for authenticated users

  2. Changes
    - Enable RLS on contacts table
    - Enable RLS on messages table
    - Enable RLS on company_info table
    - Enable RLS on inactive table
    - Add policies for authenticated users to access data
*/

-- Enable RLS on all tables
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE inactive ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to read contacts"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read company info"
  ON company_info
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read inactive status"
  ON inactive
  FOR SELECT
  TO authenticated
  USING (true);