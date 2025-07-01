# Inject Comments Setup Guide

This guide will help you set up the new inject comments functionality in your SecuTable platform.

## Database Migration

You need to run the database migration to create the `inject_comments` table and set up Row Level Security (RLS) policies.

### Step 1: Run the Migration

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `db/migrations/005_add_inject_comments.sql`
4. Click "Run" to execute the migration

### Step 2: Verify the Migration

After running the migration, you should see:
- A new `inject_comments` table in your database
- RLS policies that ensure users can only access comments for their own injects
- Proper indexes for performance

## Features Added

### 1. Comment Management
- **Add Comments**: Users can add comments to any inject in their scenarios
- **View Comments**: Comments are displayed below each inject with timestamps
- **Delete Comments**: Users can delete their own comments
- **User Attribution**: Comments show the user's email (if available)

### 2. UI Components
- **Scenario Page (`/scenarios/[id]`)**: 
  - Interactive comment input with "Add Comment" button
  - Real-time comment display
  - Delete functionality for user's own comments
  
- **Report Page (`/report/[id]`)**: 
  - Read-only comment display
  - Comments are hidden if none exist
  - Subtle styling to not interfere with report readability

### 3. Security Features
- **Row Level Security**: Users can only access comments for injects they own
- **User Isolation**: Comments are properly scoped to user's scenarios
- **Cascade Deletion**: Comments are automatically deleted when injects are removed

## Usage

### Adding Comments
1. Navigate to a scenario exercise page
2. Find any inject in the "Inject Management" section
3. Click the "💬 Add Comment" button below the inject content
4. Type your comment and click "Submit"
5. Your comment will appear immediately below the inject

### Viewing Comments
- **During Exercise**: Comments appear in blue bubbles with timestamps
- **In Reports**: Comments appear in subtle gray bubbles (read-only)
- **No Comments**: Comment sections are hidden when no comments exist

### Deleting Comments
- Click the trash icon next to your own comments
- Comments from other users cannot be deleted

## Technical Details

### Database Schema
```sql
inject_comments (
  id UUID PRIMARY KEY,
  inject_id UUID REFERENCES injects(id),
  user_id UUID REFERENCES auth.users(id),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE
)
```

### Key Features
- **Real-time Updates**: Comments appear immediately after submission
- **Responsive Design**: Works on all screen sizes
- **Keyboard Shortcuts**: Press Esc to cancel comment input
- **Error Handling**: Proper error messages for failed operations
- **Loading States**: Visual feedback during comment operations

## Troubleshooting

### Comments Not Appearing
1. Check that the migration was run successfully
2. Verify RLS policies are in place
3. Ensure you're logged in and have access to the scenario

### Permission Errors
1. Make sure the scenario belongs to your user account
2. Check that the inject exists and is associated with your scenario
3. Verify your authentication status

### Performance Issues
1. The migration includes proper indexes for performance
2. Comments are loaded on-demand for each inject
3. Large numbers of comments are handled efficiently

## Next Steps

After running the migration:
1. Test the comment functionality on a scenario
2. Verify comments appear in both exercise and report views
3. Check that user isolation works correctly
4. Test the delete functionality for your own comments

The inject comments feature is now fully integrated into your SecuTable platform! 