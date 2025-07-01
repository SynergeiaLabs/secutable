#!/bin/bash

echo "🚀 SecuTable Authentication Setup"
echo "=================================="

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOF
# Supabase Configuration
# Replace these with your actual Supabase project credentials
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# OpenAI Configuration (optional - for AI-powered reports)
# OPENAI_API_KEY=your-openai-api-key

# Development Mode (optional - for testing without auth)
# NEXT_PUBLIC_USE_MOCK_AUTH=true
EOF
    echo "✅ Created .env.local file"
    echo ""
    echo "⚠️  IMPORTANT: Update the values in .env.local with your actual credentials"
else
    echo "✅ .env.local file already exists"
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "📦 Installing Supabase CLI..."
    npm install -g supabase
    echo "✅ Supabase CLI installed"
else
    echo "✅ Supabase CLI already installed"
fi

echo ""
echo "🔧 Next Steps:"
echo "1. Create a Supabase project at https://supabase.com"
echo "2. Copy your project URL and anon key to .env.local"
echo "3. Run database migrations (see SUPABASE_SETUP_GUIDE.md)"
echo "4. Configure Auth in your Supabase dashboard"
echo "5. Test the application: npm run dev"
echo ""
echo "📚 See SUPABASE_SETUP_GUIDE.md for detailed instructions" 