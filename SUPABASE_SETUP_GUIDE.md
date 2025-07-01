# Supabase Setup Guide for SecuTable

Follow these steps to set up Supabase authentication for your SecuTable application.

## Step 1: Create Environment Variables

Create a `.env.local` file in the `secutable-app` directory with the following content:

```env
# Supabase Configuration
# Replace these with your actual Supabase project credentials
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# OpenAI Configuration (optional - for AI-powered reports)
# OPENAI_API_KEY=your-openai-api-key

# Development Mode (optional - for testing without auth)
# NEXT_PUBLIC_USE_MOCK_AUTH=true
```

## Step 2: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Create a new project
4. Wait for the project to be set up (this may take a few minutes)
5. Copy your project URL and anon key from the project settings

## Step 3: Set up Supabase Auth in Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Settings**
3. Enable **Email Auth**
4. Configure email templates if needed

## Step 4: Configure Redirect URLs

In your Supabase dashboard:

1. Go to **Authentication** > **URL Configuration**
2. Add these redirect URLs:

```
http://localhost:3000/dashboard
http://localhost:3000/login
```

For production, also add:
```
https://yourdomain.com/dashboard
https://yourdomain.com/login
```

## Step 5: Run Database Migration

Execute the authentication migration in your Supabase SQL editor:

```sql
-- Copy and paste the contents of db/migrations/004_add_user_id_to_scenarios.sql
-- This adds user_id fields and updates RLS policies
```

## Step 6: Test the Authentication

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:3000`
3. You should be redirected to `/login`
4. Create a new account or sign in
5. Test the authentication flow

## Step 7: Verify RLS Policies

After running the migration, verify these policies exist in your database:

```sql
-- Check scenarios policies
SELECT * FROM pg_policies WHERE tablename = 'scenarios';

-- Check injects policies  
SELECT * FROM pg_policies WHERE tablename = 'injects';
```

## Troubleshooting

### Common Issues:

1. **"User not authenticated" error**
   - Check if `.env.local` file exists and has correct values
   - Verify Supabase project is active
   - Check browser console for auth errors

2. **Cannot access scenarios**
   - Verify RLS policies are active
   - Check if migration was run successfully
   - Ensure user_id is being set correctly

3. **Magic link not working**
   - Check email configuration in Supabase
   - Verify redirect URLs are set correctly
   - Check spam folder for emails

4. **Environment variables not loading**
   - Restart the development server after creating `.env.local`
   - Check file permissions
   - Verify variable names are correct

## Next Steps

Once authentication is working:

1. Test user isolation by creating scenarios with different accounts
2. Customize email templates for better UX
3. Set up production environment variables
4. Configure monitoring and logging

## Production Deployment

For production deployment:

1. Create a production Supabase project
2. Update environment variables with production URLs
3. Configure proper email delivery
4. Set up monitoring and backups
5. Enable HTTPS and security headers 