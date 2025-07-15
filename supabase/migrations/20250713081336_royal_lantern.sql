/*
  # Add missing RLS policies for messaging

  1. Security
    - Add INSERT policy for messages table
    - Add INSERT policy for message_reactions table  
    - Add INSERT policy for polls table
    - Add INSERT policy for poll_votes table
*/

-- Allow users to insert messages in rooms they are members of
CREATE POLICY "Users can send messages in joined rooms"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM room_members 
      WHERE room_id = messages.room_id 
      AND user_id = auth.uid() 
      AND is_active = true
    )
  );

-- Allow users to insert reactions to messages
CREATE POLICY "Users can add reactions"
  ON message_reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to create polls in rooms they are members of
CREATE POLICY "Users can create polls in joined rooms"
  ON polls
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM room_members 
      WHERE room_id = polls.room_id 
      AND user_id = auth.uid() 
      AND is_active = true
    )
  );

-- Allow users to vote on polls
CREATE POLICY "Users can vote on polls"
  ON poll_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM room_members rm
      JOIN polls p ON p.room_id = rm.room_id
      WHERE p.id = poll_votes.poll_id 
      AND rm.user_id = auth.uid() 
      AND rm.is_active = true
    )
  );