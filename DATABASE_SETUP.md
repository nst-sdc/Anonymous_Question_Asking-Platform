# 🗄️ Database Setup Guide

## Quick Setup (Recommended)

### Option 1: Using Supabase Dashboard (Easiest)

1. Go to your Supabase project: https://dsbwcnjczwpkkqsmbges.supabase.co
2. Navigate to **SQL Editor** in the left sidebar
3. Run each migration file in order:

#### Migration 1: Create Tables
Copy and paste the contents of [20250713080623_little_bird.sql](file:///Users/arpitsarang/Desktop/Anonymous_Question_Asking-Platform/supabase/migrations/20250713080623_little_bird.sql)

#### Migration 2: Fix RLS Policies
Copy and paste the contents of [20250713081053_ancient_math.sql](file:///Users/arpitsarang/Desktop/Anonymous_Question_Asking-Platform/supabase/migrations/20250713081053_ancient_math.sql)

#### Migration 3: Add Insert Policies
Copy and paste the contents of [20250713081336_royal_lantern.sql](file:///Users/arpitsarang/Desktop/Anonymous_Question_Asking-Platform/supabase/migrations/20250713081336_royal_lantern.sql)

---

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref dsbwcnjczwpkkqsmbges

# Run migrations
supabase db push
```

---

## Database Schema Overview

### Tables Created

- **`rooms`** - Chat rooms with unique 6-digit codes
- **`room_members`** - User memberships with anonymous IDs
- **`messages`** - Chat messages with reply support
- **`message_reactions`** - Emoji reactions to messages
- **`polls`** - Interactive polls (yes/no or multiple choice)
- **`poll_votes`** - User votes on polls

### Security Features

✅ Row Level Security (RLS) enabled on all tables  
✅ Authenticated users only  
✅ Room-based access control  
✅ Users can only access data from rooms they've joined

---

## Verify Database Setup

After running migrations, verify in Supabase Dashboard:

1. Go to **Table Editor**
2. You should see these tables:
   - rooms
   - room_members
   - messages
   - message_reactions
   - polls
   - poll_votes

3. Go to **Database** → **Policies**
4. Verify RLS policies are active for all tables
