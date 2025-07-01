# Authentication Setup for SecuTable

This document provides instructions for setting up authentication in the SecuTable cybersecurity tabletop exercise platform using Supabase Auth.

## Overview

The authentication system includes:
- Email/password authentication
- Magic link authentication
- User session management
- Protected routes
- User-specific scenario ownership

## Database Setup

### 1. Run the Authentication Migration

Execute the migration to add user_id fields and update RLS policies:

```sql
-- Run the migration file: db/migrations/004_add_user_id_to_scenarios.sql
```

This migration:
- Adds `user_id` column to `scenarios` table
- Adds `user_id` column to `injects` table
- Updates RLS policies to filter by user_id
- Ensures users can only access their own scenarios

### 2. Verify RLS Policies

After running the migration, verify these policies exist:

**Scenarios Table:**
```sql
-- Users can view their own scenarios
CREATE POLICY "Users can view their own scenarios" ON scenarios
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own scenarios
CREATE POLICY "Users can insert their own scenarios" ON scenarios
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own scenarios
CREATE POLICY "Users can update their own scenarios" ON scenarios
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own scenarios
CREATE POLICY "Users can delete their own scenarios" ON scenarios
    FOR DELETE USING (auth.uid() = user_id);
```

**Injects Table:**
```sql
-- Users can view their own injects
CREATE POLICY "Users can view their own injects" ON injects
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own injects
CREATE POLICY "Users can insert their own injects" ON injects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own injects
CREATE POLICY "Users can update their own injects" ON injects
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own injects
CREATE POLICY "Users can delete their own injects" ON injects
    FOR DELETE USING (auth.uid() = user_id);
```

## Supabase Configuration

### 1. Enable Authentication

In your Supabase dashboard:

1. Go to **Authentication** > **Settings**
2. Enable **Email Auth**
3. Configure email templates if needed
4. Set up SMTP settings for email delivery

### 2. Configure Email Templates (Optional)

Customize the email templates for:
- Email confirmation
- Magic link emails
- Password reset emails

### 3. Set up Redirect URLs

Add these redirect URLs in **Authentication** > **URL Configuration**:

```
http://localhost:3000/dashboard
http://localhost:3000/login
```

For production, add your domain URLs as well.

## Environment Variables

Ensure these environment variables are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Application Structure

### Authentication Flow

1. **Root Page (`/`)**: Redirects authenticated users to `/dashboard`, unauthenticated users to `/login`
2. **Login Page (`/login`)**: Handles email/password and magic link authentication
3. **Dashboard (`/dashboard`)**: Shows user's scenarios and provides navigation
4. **Protected Routes**: All scenario-related pages require authentication

### Key Components

- **AuthProvider** (`lib/authContext.tsx`): Manages authentication state
- **ProtectedRoute** (`components/ProtectedRoute.tsx`): Wraps protected pages
- **LoginPage** (`app/login/page.tsx`): Authentication interface
- **DashboardPage** (`app/dashboard/page.tsx`): User dashboard

### Protected Pages

These pages are wrapped with `ProtectedRoute`:
- `/scenarios` - Scenario list
- `/scenarios/[id]` - Exercise control panel
- `/report/[id]` - Exercise reports

## User Experience

### Authentication Options

Users can authenticate using:

1. **Email/Password**: Traditional login
2. **Magic Link**: Passwordless authentication via email
3. **Sign Up**: New user registration

### Session Management

- Sessions persist across browser sessions
- Automatic token refresh
- Automatic logout on token expiration
- Session state shared across all components

### User-Specific Data

- Scenarios are automatically associated with the authenticated user
- Users can only see and manage their own scenarios
- All database queries are filtered by user_id via RLS

## Testing the Authentication

### 1. Create a Test User

1. Navigate to `/login`
2. Click "Don't have an account? Sign up"
3. Enter email and password
4. Check email for confirmation link
5. Click confirmation link

### 2. Test Protected Routes

1. Try accessing `/scenarios` without authentication
2. Should redirect to `/login`
3. After login, should access the page normally

### 3. Test User Isolation

1. Create scenarios with User A
2. Login as User B
3. Verify User B cannot see User A's scenarios

### 4. Test Magic Link

1. Go to `/login`
2. Click "Use magic link instead"
3. Enter email address
4. Check email for magic link
5. Click link to authenticate

## Security Features

### Row Level Security (RLS)

- All database operations are filtered by user_id
- Users cannot access other users' data
- Policies are enforced at the database level

### Session Security

- JWT tokens with expiration
- Automatic token refresh
- Secure session storage
- CSRF protection

### Input Validation

- Email format validation
- Password strength requirements
- File upload validation
- SQL injection prevention via parameterized queries

## Troubleshooting

### Common Issues

1. **"User not authenticated" error**
   - Check if user is logged in
   - Verify session is valid
   - Check browser console for auth errors

2. **Cannot access scenarios**
   - Verify RLS policies are active
   - Check user_id is set correctly
   - Ensure scenarios have user_id populated

3. **Magic link not working**
   - Check email configuration
   - Verify redirect URLs are set
   - Check spam folder

4. **Session not persisting**
   - Check browser storage settings
   - Verify auth configuration
   - Check for JavaScript errors

### Debug Mode

Enable debug logging in development:

```typescript
// In supabaseClient.ts
if (process.env.NODE_ENV === 'development') {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Supabase auth state changed:', event, session?.user?.id);
  });
}
```

## Production Considerations

### Security Checklist

- [ ] Enable HTTPS in production
- [ ] Configure proper CORS settings
- [ ] Set up proper email delivery
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Regular security audits

### Performance

- RLS policies are optimized for user_id filtering
- Session caching reduces database queries
- Lazy loading of protected components
- Efficient token refresh mechanism

## API Reference

### AuthContext Hook

```typescript
const { user, session, loading, signOut } = useAuth();
```

### Protected Route Component

```typescript
<ProtectedRoute>
  <YourComponent />
</ProtectedRoute>
```

### Authentication Functions

```typescript
// Sign in with password
await supabase.auth.signInWithPassword({ email, password });

// Sign in with magic link
await supabase.auth.signInWithOtp({ email });

// Sign up
await supabase.auth.signUp({ email, password });

// Sign out
await supabase.auth.signOut();

// Get current user
const { data: { user } } = await supabase.auth.getUser();
```

This authentication system provides a secure, user-friendly experience while ensuring data isolation and protection. 