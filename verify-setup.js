#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying SecuTable Setup...\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  console.log('✅ .env.local file exists');
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('NEXT_PUBLIC_SUPABASE_URL') && envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
    console.log('✅ Environment variables are configured');
  } else {
    console.log('❌ Environment variables are missing');
  }
} else {
  console.log('❌ .env.local file is missing');
}

// Check if required files exist
const requiredFiles = [
  'lib/authContext.tsx',
  'lib/supabaseClient.ts',
  'components/ProtectedRoute.tsx',
  'app/login/page.tsx',
  'app/dashboard/page.tsx',
  'setup-database.sql',
  'AUTHENTICATION_SETUP.md'
];

console.log('\n📁 Checking required files:');
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
});

// Check package.json dependencies
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const requiredDeps = ['@supabase/supabase-js', 'next', 'react', 'react-dom'];
  
  console.log('\n📦 Checking dependencies:');
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ ${dep} (${packageJson.dependencies[dep]})`);
    } else if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
      console.log(`✅ ${dep} (${packageJson.devDependencies[dep]}) - dev dependency`);
    } else {
      console.log(`❌ ${dep} - MISSING`);
    }
  });
}

console.log('\n🎯 Next Steps:');
console.log('1. Run the database setup script in Supabase Studio');
console.log('2. Configure authentication in Supabase dashboard');
console.log('3. Test the application at http://localhost:3000');
console.log('4. Check SETUP_CHECKLIST.md for detailed instructions');

console.log('\n✨ Setup verification complete!'); 