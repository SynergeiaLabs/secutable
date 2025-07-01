# SecuTable - Cybersecurity Tabletop Exercise Platform

A comprehensive web application for creating, running, and analyzing cybersecurity tabletop exercises (TTX) with AI-powered insights.

## Features

- **Scenario Management**: Create detailed cybersecurity incident scenarios with timed injects
- **Exercise Execution**: Real-time control panel with timer, inject management, and response tracking
- **IRP Integration**: Upload and parse Incident Response Plan documents (PDF, DOCX, Markdown)
- **Performance Analytics**: Track response times and success rates by IRP phase
- **AI-Powered Reports**: Generate After Action Reports using OpenAI GPT-4
- **Collaboration**: Add comments and observations during exercises
- **Multi-User Support**: Secure user isolation with Supabase authentication

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI**: OpenAI GPT-4 for report generation
- **File Processing**: Mammoth.js for DOCX parsing

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenAI API key (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/secutable.git
   cd secutable
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` and add your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   OPENAI_API_KEY=your-openai-api-key  # Optional
   ```

4. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the database migrations (see `SUPABASE_SETUP_GUIDE.md`)
   - Configure authentication settings

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Documentation

- [Supabase Setup Guide](SUPABASE_SETUP_GUIDE.md) - Complete authentication setup
- [Database Migrations](db/migrations/) - SQL migration files
- [IRP Parsing Setup](IRP_PARSING_SETUP.md) - Document parsing configuration
- [Inject Comments Setup](INJECT_COMMENTS_SETUP.md) - Collaboration features

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Project Structure

```
secutable-app/
├── app/                    # Next.js app router pages
│   ├── dashboard/         # Main dashboard
│   ├── scenarios/         # Scenario management
│   ├── report/           # Exercise reports
│   └── login/            # Authentication
├── components/            # Reusable React components
├── lib/                   # Utility functions and configurations
├── db/                    # Database migrations
└── public/               # Static assets
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- Create an issue for bugs or feature requests
- Check the documentation in the `/docs` folder
- Review the setup guides for common issues

## Security

- All user data is isolated using Row Level Security (RLS)
- Authentication is handled by Supabase Auth
- File uploads are validated and stored securely
- Environment variables are used for sensitive configuration

---

Built with ❤️ for the cybersecurity community
