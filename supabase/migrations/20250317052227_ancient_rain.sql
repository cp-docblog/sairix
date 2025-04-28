/*
  # Add to field to messages table

  1. Changes
    - Add `to` column to messages table to track message recipients
    - Update message queries to handle bidirectional messages

  2. Security
    - Maintain existing RLS policies
*/

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS "to" numeric;

-- Add an index to improve query performance
CREATE INDEX IF NOT EXISTS messages_to_from_idx ON messages ("to", "from");