# 🚀 SecuTable Authentication Setup Checklist

## ✅ Completed Steps

- [x] Created authentication components and pages
- [x] Set up environment variables (.env.local)
- [x] Started local Supabase instance
- [x] Created database setup script (setup-database.sql)
- [x] Restarted development server

## 🔧 Remaining Steps

### 1. Run Database Setup Script

1. Open Supabase Studio: http://127.0.0.1:54323
2. Go to **SQL Editor**
3. Copy and paste the contents of `setup-database.sql`
4. Click **Run** to execute the script
5. Verify the tables and policies were created

### 2. Configure Supabase Authentication

1. In Supabase Studio, go to **Authentication** > **Settings**
2. Enable **Email Auth**
3. Configure email templates (optional)
4. Go to **Authentication** > **URL Configuration**
5. Add these redirect URLs:
   ```
   http://localhost:3000/dashboard
   http://localhost:3000/login
   ```

### 3. Test the Authentication

1. Visit http://localhost:3000
2. You should be redirected to `/login`
3. Click "Don't have an account? Sign up"
4. Enter your email and password
5. Check your email for confirmation (check spam folder)
6. Click the confirmation link
7. You should be redirected to `/dashboard`

### 4. Test User Isolation

1. Create a scenario while logged in
2. Sign out and create a new account
3. Verify the new user cannot see the first user's scenarios
4. This confirms RLS policies are working

### 5. Test All Features

- [ ] Create a new scenario
- [ ] Upload an IRP document
- [ ] Run an exercise
- [ ] View the report
- [ ] Test magic link authentication

## 🔍 Verification Commands

Run these in Supabase Studio SQL Editor to verify setup:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('scenarios', 'injects');

-- Check RLS policies
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('scenarios', 'injects');

-- Check storage bucket
SELECT * FROM storage.buckets WHERE id = 'irp_documents';
```

## 🐛 Troubleshooting

### Common Issues:

1. **"User not authenticated" error**
   - Check browser console for errors
   - Verify .env.local has correct values
   - Restart the development server

2. **Cannot access scenarios**
   - Verify RLS policies were created
   - Check if user_id is being set
   - Look for database errors in console

3. **Magic link not working**
   - Check email configuration
   - Verify redirect URLs are set
   - Check spam folder

4. **Database connection issues**
   - Ensure Supabase is running: `supabase status`
   - Check environment variables
   - Restart Supabase: `supabase stop && supabase start`

## 🎉 Success Indicators

You'll know everything is working when:

- [ ] You can sign up and log in
- [ ] You're redirected to dashboard after login
- [ ] You can create scenarios
- [ ] Scenarios are associated with your user account
- [ ] Other users cannot see your scenarios
- [ ] Magic link authentication works
- [ ] All protected routes require authentication

## 📞 Next Steps After Setup

1. **Customize the UI** - Modify colors, branding, etc.
2. **Add more features** - User profiles, team collaboration, etc.
3. **Deploy to production** - Set up production Supabase project
4. **Configure monitoring** - Set up logging and analytics
5. **Security audit** - Review and test security measures

## 🆘 Need Help?

- Check the browser console for errors
- Review the `AUTHENTICATION_SETUP.md` file
- Check Supabase logs: `supabase logs`
- Verify all environment variables are set correctly

---

**🎯 Goal**: A fully functional, secure authentication system for SecuTable with user isolation and data protection. 