/*
  # Add creator_anonymous_id to polls table

  1. Changes
    - Add `creator_anonymous_id` column to polls table
    - This column stores the anonymous ID of the poll creator
    - Allows tracking who created polls while maintaining anonymity

  2. Notes
    - Column is nullable for backward compatibility with existing polls
    - Future polls will have this field populated
*/

-- Add creator_anonymous_id column to polls table
ALTER TABLE polls 
ADD COLUMN IF NOT EXISTS creator_anonymous_id text;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_polls_creator_anonymous_id ON polls(creator_anonymous_id);
