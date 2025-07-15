/*
  # AnonyMeet Database Schema

  1. New Tables
    - `rooms`
      - `id` (uuid, primary key)
      - `name` (text, room name)
      - `code` (text, unique 6-character code)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `room_members`
      - `id` (uuid, primary key)
      - `room_id` (uuid, references rooms)
      - `user_id` (uuid, references auth.users)
      - `anonymous_id` (text, like "Anon#A12F")
      - `joined_at` (timestamp)
      - `is_active` (boolean)
    
    - `messages`
      - `id` (uuid, primary key)
      - `room_id` (uuid, references rooms)
      - `user_id` (uuid, references auth.users)
      - `content` (text)
      - `reply_to` (uuid, references messages, nullable)
      - `created_at` (timestamp)
    
    - `message_reactions`
      - `id` (uuid, primary key)
      - `message_id` (uuid, references messages)
      - `user_id` (uuid, references auth.users)
      - `reaction_type` (text, 'yes' or 'no')
      - `created_at` (timestamp)
    
    - `polls`
      - `id` (uuid, primary key)
      - `room_id` (uuid, references rooms)
      - `created_by` (uuid, references auth.users)
      - `question` (text)
      - `poll_type` (text, 'yesno' or 'multiple')
      - `options` (jsonb, array of options)
      - `created_at` (timestamp)
      - `is_active` (boolean)
    
    - `poll_votes`
      - `id` (uuid, primary key)
      - `poll_id` (uuid, references polls)
      - `user_id` (uuid, references auth.users)
      - `option_index` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their data
    - Room-based access control for messages and polls
*/

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create room_members table
CREATE TABLE IF NOT EXISTS room_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_id text NOT NULL,
  joined_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(room_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  reply_to uuid REFERENCES messages(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create message_reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('yes', 'no')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id, reaction_type)
);

-- Create polls table
CREATE TABLE IF NOT EXISTS polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  question text NOT NULL,
  poll_type text NOT NULL CHECK (poll_type IN ('yesno', 'multiple')),
  options jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Create poll_votes table
CREATE TABLE IF NOT EXISTS poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid REFERENCES polls(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  option_index integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Policies for rooms
CREATE POLICY "Users can create rooms"
  ON rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view rooms they are members of"
  ON rooms
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT room_id FROM room_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Room creators can update their rooms"
  ON rooms
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- Policies for room_members
CREATE POLICY "Users can join rooms"
  ON room_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view room members for rooms they are in"
  ON room_members
  FOR SELECT
  TO authenticated
  USING (
    room_id IN (
      SELECT room_id FROM room_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update their own membership"
  ON room_members
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for messages
CREATE POLICY "Users can send messages to rooms they are members of"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    room_id IN (
      SELECT room_id FROM room_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can view messages from rooms they are members of"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    room_id IN (
      SELECT room_id FROM room_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Policies for message_reactions
CREATE POLICY "Users can react to messages in rooms they are members of"
  ON message_reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    message_id IN (
      SELECT m.id FROM messages m
      JOIN room_members rm ON m.room_id = rm.room_id
      WHERE rm.user_id = auth.uid() AND rm.is_active = true
    )
  );

CREATE POLICY "Users can view reactions in rooms they are members of"
  ON message_reactions
  FOR SELECT
  TO authenticated
  USING (
    message_id IN (
      SELECT m.id FROM messages m
      JOIN room_members rm ON m.room_id = rm.room_id
      WHERE rm.user_id = auth.uid() AND rm.is_active = true
    )
  );

CREATE POLICY "Users can update their own reactions"
  ON message_reactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
  ON message_reactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for polls
CREATE POLICY "Users can create polls in rooms they are members of"
  ON polls
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    room_id IN (
      SELECT room_id FROM room_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can view polls in rooms they are members of"
  ON polls
  FOR SELECT
  TO authenticated
  USING (
    room_id IN (
      SELECT room_id FROM room_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Poll creators can update their polls"
  ON polls
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- Policies for poll_votes
CREATE POLICY "Users can vote on polls in rooms they are members of"
  ON poll_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    poll_id IN (
      SELECT p.id FROM polls p
      JOIN room_members rm ON p.room_id = rm.room_id
      WHERE rm.user_id = auth.uid() AND rm.is_active = true
    )
  );

CREATE POLICY "Users can view poll votes in rooms they are members of"
  ON poll_votes
  FOR SELECT
  TO authenticated
  USING (
    poll_id IN (
      SELECT p.id FROM polls p
      JOIN room_members rm ON p.room_id = rm.room_id
      WHERE rm.user_id = auth.uid() AND rm.is_active = true
    )
  );

CREATE POLICY "Users can update their own votes"
  ON poll_votes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_polls_room_id ON polls(room_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON poll_votes(poll_id);

-- Function to generate room codes
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to generate anonymous IDs
CREATE OR REPLACE FUNCTION generate_anonymous_id()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := 'Anon#';
  i integer;
BEGIN
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;