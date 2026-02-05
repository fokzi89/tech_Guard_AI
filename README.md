# TechGuard AI

TechGuard AI is an advanced, AI-powered industrial troubleshooting and diagnostics platform designed to assist field technicians in diagnosing and repairing complex machinery. It leverages multi-modal AI agents to provide step-by-step guidance, component identification, and safety verification.

## 🚀 Features

*   **AI-Assisted Troubleshooting**: Expert diagnostic agents that guide technicians through complex repair procedures.
*   **Photo Diagnostics**: Upload photos of components or wiring for visual analysis, damage detection, and validation against manuals.
*   **Safety First**: Built-in "Guardian" safety protocols, lockout/tagout verification, and real-time safety monitoring.
*   **Multi-Tenant Architecture**: Organization-based access control (Super Admin, Org Admin, Technician roles).
*   **Knowledge Base Integration**: RAG (Retrieval-Augmented Generation) system to query technical manuals and diagrams.
*   **Audit Logging**: Comprehensive logs for all safety-critical actions and administrative changes.

## 🛠️ Technology Stack

*   **Frontend**: [Next.js 14](https://nextjs.org/) (App Router), [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/)
*   **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage, Realtime)
*   **AI & ML**: [Vercel AI SDK](https://sdk.vercel.ai/), Google Gemini Pro / Vision models
*   **Testing**: [Vitest](https://vitest.dev/) (Unit), [Playwright](https://playwright.dev/) (E2E)

## 📋 Prerequisites

*   Node.js 18+ installed
*   npm or yarn
*   A Supabase project (for local dev, you can use Supabase CLI or a hosted project)

## 🏁 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-org/techguard-ai.git
cd techguard-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env.local
```

Update `.env.local` with your database credentials and API keys:

*   `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL
*   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key
*   `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key (for Admin API routes)
*   `GOOGLE_GENERATIVE_AI_API_KEY`: API Key for Gemini Pro
*   `NEXT_PUBLIC_APP_URL`: http://localhost:3000

### 4. Database Setup

Follow the detailed instructions in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) to apply migrations and seed initial data.

Quick start (if using Supabase CLI):
```bash
npx supabase db reset
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## 🧪 Testing

### Unit Tests
Run unit tests using Vitest:
```bash
npm run test
```

### End-to-End Tests
Run E2E tests using Playwright:
```bash
# Install browsers first
npx playwright install

# Run tests
npx playwright test
```

## 📂 Project Structure

*   `app/`: Next.js App Router pages and API routes
    *   `api/`: Backend API endpoints (chat, admin, auth)
    *   `components/`: Reusable UI components
    *   `dashboard/`: Main application interface
*   `lib/`: Utility functions, database clients, and AI agent definitions
*   `supabase/`: Database migrations, seed data, and tests
*   `tests/`: E2E tests
*   `specs/`: Project specifications and documentation

## 🔒 Security

This project enforces strict Row Level Security (RLS) on the database.
*   **Impersonation**: Admins can impersonate users for support, with full audit logging.
*   **Safety**: The "Guardian" agent intercepts unsafe user inputs in real-time.

## 📄 License

MIT
