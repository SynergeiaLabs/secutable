# SecuTable - Cybersecurity Tabletop Exercise Platform
A professional, full-stack platform for creating, running, and analyzing cybersecurity tabletop exercises with AI-powered insights and real-time collaboration.

# Core Features

# Scenario Management
    - Comprehensive Scenario Builder: Create detailed cybersecurity scenarios with background context, risk themes, and exercise assumptions
    - Rich Text Editing: Full scenario details including title, description, background, key themes, and assumptions
    - Scenario Library: View, edit, and manage all your created scenarios in an organized dashboard

# Incident Response Plan (IRP) Integration
    - Document Upload: Upload IRP documents in PDF, DOCX, Markdown, or TXT formats
    - Document Storage: Secure file storage using Supabase Storage with proper access controls
    - IRP Parsing: Extract and integrate IRP content into exercise scenarios
    - Document Management: Organize and reference IRP documents during exercises

# Inject Timeline System
    - Timed Injects: Create injects with specific time offsets (e.g., T+5, T+15 minutes)
    - Role-Based Targeting: Assign injects to specific roles (Incident Commander, Technical Lead, etc.)
    - Dynamic Timeline: Add, edit, and remove injects during scenario creation
    - Real-time Delivery: Track inject delivery and participant responses

# Collaborative Comments
    - Real-time Comments: Add comments to individual injects during exercises
    - User Attribution: Track who made each comment with timestamps
    - Comment Management: Edit and delete comments with proper permissions
    - Exercise Documentation: Capture insights and observations during tabletop exercises

# AI-Powered Analysis
    - After Action Reports: Generate comprehensive AARs using OpenAI GPT-4
    - Intelligent Insights: AI analysis of exercise outcomes and participant responses
    - Recommendation Engine: Get actionable recommendations for improving incident response
    - Automated Summaries: Generate executive summaries and key findings

# User Management & Security
    - Supabase Authentication: Secure user registration and login
    - Row Level Security (RLS): Complete data isolation between users
    - Role-Based Access: Users can only access their own scenarios and data
    - Session Management: Secure session handling with automatic logout

# Modern UI/UX
    - Responsive Design: Works seamlessly on desktop, tablet, and mobile devices
    - Professional Interface: Clean, modern design built with Tailwind CSS
    - Intuitive Navigation: Easy-to-use interface for scenario creation and management
    - Real-time Updates: Live updates without page refreshes

# Database & Storage
    - PostgreSQL Database: Robust data storage with proper relationships
    - File Storage: Secure document storage with access controls
    - Data Migration: Comprehensive migration system for database schema updates
    - Backup & Recovery: Built-in data protection and recovery capabilities

# Technical Stack
    - Frontend: Next.js 15, React 18, TypeScript, Tailwind CSS
    - Backend: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
    - AI Integration: OpenAI GPT-4 API
    - Deployment: Vercel-ready with environment configuration
    - Development: Hot reload, TypeScript compilation, ESLint

# Use Cases
    - Security Teams: Create realistic incident response scenarios
    - Training Programs: Develop cybersecurity training exercises
    - Compliance Testing: Validate incident response procedures
    - Team Building: Improve collaboration and communication during incidents
    - Risk Assessment: Identify gaps in incident response capabilities

# Security Features
    - Data Isolation: Complete user data separation
    - Secure Authentication: Supabase Auth with proper session management
    - File Security: Encrypted document storage with access controls
    - Input Validation: Comprehensive input sanitization and validation
    - Error Handling: Secure error handling without information leakage

# Reporting & Analytics
    - Exercise Reports: Detailed reports of tabletop exercise outcomes
    - Participant Tracking: Monitor participant engagement and responses
    - Performance Metrics: Track scenario effectiveness and completion rates
    - Export Capabilities: Export reports and data for external analysis
