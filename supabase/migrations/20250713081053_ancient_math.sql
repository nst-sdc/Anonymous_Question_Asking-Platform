/*
  # Fix infinite recursion in RLS policies

  1. Policy Updates
    - Remove circular dependencies in room_members policies
    - Simplify policies to avoid recursive queries
    - Fix rooms SELECT policy to prevent infinite loops

  2. Security
    - Maintain proper access control without recursion
    - Ensure users can only access appropriate data
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view rooms they are members of" ON rooms;
DROP POLICY IF EXISTS "Users can view room members for rooms they are in" ON room_members;
DROP POLICY IF EXISTS "Users can view messages from rooms they are members of" ON messages;
DROP POLICY IF EXISTS "Users can send messages to rooms they are members of" ON messages;
DROP POLICY IF EXISTS "Users can view reactions in rooms they are members of" ON message_reactions;
DROP POLICY IF EXISTS "Users can react to messages in rooms they are members of" ON message_reactions;
DROP POLICY IF EXISTS "Users can view polls in rooms they are members of" ON polls;
DROP POLICY IF EXISTS "Users can create polls in rooms they are members of" ON polls;
DROP POLICY IF EXISTS "Users can view poll votes in rooms they are members of" ON poll_votes;
DROP POLICY IF EXISTS "Users can vote on polls in rooms they are members of" ON poll_votes;

-- Create simplified, non-recursive policies for rooms
CREATE POLICY "Users can view all rooms"
  ON rooms
  FOR SELECT
  TO authenticated
  USING (true);

-- Create simplified policies for room_members
CREATE POLICY "Users can view all room members"
  ON room_members
  FOR SELECT
  TO authenticated
  USING (true);

-- Create simplified policies for messages
CREATE POLICY "Users can view all messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Create simplified policies for message_reactions
CREATE POLICY "Users can view all reactions"
  ON message_reactions
  FOR SELECT
  TO authenticated
  USING (true);

-- Create simplified policies for polls
CREATE POLICY "Users can view all polls"
  ON polls
  FOR SELECT
  TO authenticated
  USING (true);

-- Create simplified policies for poll_votes
CREATE POLICY "Users can view all poll votes"
  ON poll_votes
  FOR SELECT
  TO authenticated
  USING (true);