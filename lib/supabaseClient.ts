import { createClient } from '@supabase/supabase-js';

// Supabase configuration - requires environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
  );
}

// Create Supabase client with error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'secutable-app'
    }
  }
});

// Add error handling for client initialization
if (typeof window !== 'undefined') {
  // Only run in browser
  supabase.auth.onAuthStateChange((event, session) => {
    // Silently handle auth state changes to prevent console errors
    if (process.env.NODE_ENV === 'development') {
      // Only log in development if needed
      // console.log('Auth state changed:', event);
    }
  });
}

// Optional: Add request logging for debugging
// TEMPORARILY DISABLED FOR TESTING
// if (process.env.NODE_ENV === 'development') {
//   supabase.auth.onAuthStateChange((event, session) => {
//     console.log('Supabase auth state changed:', event, session?.user?.id);
//   });
// } 