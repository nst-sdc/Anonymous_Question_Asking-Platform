# 🔧 Apply Database Migration - Fix Missing Column

## Issue
The `polls` table is missing the `creator_anonymous_id` column, causing poll creation to fail.

## Migration Created
📄 [`supabase/migrations/20250121000000_add_creator_anonymous_id.sql`](file:///Users/arpitsarang/Desktop/Anonymous_Question_Asking-Platform/supabase/migrations/20250121000000_add_creator_anonymous_id.sql)

---

## How to Apply This Migration

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open your Supabase project:**
   - Go to https://dsbwcnjczwpkkqsmbges.supabase.co

2. **Navigate to SQL Editor:**
   - Click **SQL Editor** in the left sidebar

3. **Run the migration:**
   - Click **New Query**
   - Copy and paste the following SQL:

```sql
-- Add creator_anonymous_id column to polls table
ALTER TABLE polls 
ADD COLUMN IF NOT EXISTS creator_anonymous_id text;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_polls_creator_anonymous_id ON polls(creator_anonymous_id);
```

4. **Execute:**
   - Click **Run** or press `Ctrl/Cmd + Enter`

5. **Verify:**
   - Go to **Table Editor** → **polls**
   - You should see the new `creator_anonymous_id` column

---

### Option 2: Using Supabase CLI

```bash
# Make sure you're in the project directory
cd /Users/arpitsarang/Desktop/Anonymous_Question_Asking-Platform

# Link to your project (if not already linked)
supabase link --project-ref dsbwcnjczwpkkqsmbges

# Push the migration
supabase db push
```

---

## Verification

After applying the migration, verify it worked:

### Check in Supabase Dashboard
1. Go to **Table Editor** → **polls**
2. Look for `creator_anonymous_id` column
3. It should be type `text` and nullable

### Test Poll Creation
1. Open your app at http://localhost:5173
2. Join or create a room
3. Create a poll
4. It should now work without errors! ✅

---

## What This Fixes

✅ Poll creation will no longer fail  
✅ Backend can now store who created each poll anonymously  
✅ Maintains user anonymity while tracking poll creators  
✅ Fixes database constraint errors

---

## Next Steps

After applying this migration:
1. Restart your backend server (if needed)
2. Test creating a poll
3. Check that polls are saved correctly in Supabase
