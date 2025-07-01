# SecuTable

**AI-powered Cybersecurity Tabletop Exercises. Built for Resilience. Open for All.**

SecuTable is an open-source platform for running structured, AI-assisted tabletop simulations. Teams can define scenarios, manage injects, upload their incident response plans (IRPs), and receive GPT-generated after action reports with performance analysis and improvement recommendations.

# 🌍 Project Vision
Resilience shouldn't be a black box. By open-sourcing SecuTable, we hope to improve how security teams learn, rehearse, and evolve their real-world incident response capabilities.

---

## ✳️ Features

- ✅ Scenario builder: background, risks, assumptions, timeline
- ⏱️ Timed and manual injects with role assignment
- 📥 IRP upload and GPT-powered phase parsing
- 📊 Performance scoring: on-time, delayed, missed
- 🧠 After Action Report: GPT feedback + IRP enhancement suggestions
- 📝 Optional comments on each inject
- 📄 PDF report export
- 🔐 User auth with Supabase
- 🌐 Built with Next.js, Tailwind CSS, Supabase, and GPT-4

---

## 🚀 Quickstart

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/secutable.git
cd secutable
```

### 2. Install Dependencies

```npm install```

### 3. Start Supabase locally

Ensure Docker is running, then:

```supabase start```

### 4. Set up your environment

Create a .env.local file based on the provided .env.example:

```NEXT_PUBLIC_SUPABASE_URL=your-local-or-hosted-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Run the app

```npm run dev```

### 🧪 Seed Sample Data (Optional)
You can seed a demo scenario, injects, and mock IRP with:

```ts-node scripts/seed.ts```


# 📦 Tech Stack

- Next.js (App Router)
- Supabase (DB, Auth, Storage)
- Tailwind CSS (UI)
- OpenAI GPT-4 (reporting + IRP analysis)


 # 🤝 Contributing

1. Fork the repo
2. Create a new branch (git checkout -b feature/your-feature)
3. Commit changes and push (git push origin feature/your-feature)
4. Open a pull request

# 🪪 License

MIT — free for personal or commercial use. Attribution appreciated.
