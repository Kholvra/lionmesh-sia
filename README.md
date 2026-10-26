# lionmesh-sia

Starter app untuk Sistem Informasi Akademik berbasis **Next.js + Supabase**.

## Stack

- Next.js 16 App Router + TypeScript
- Tailwind CSS
- Supabase Postgres
- Supabase Auth dengan SSR cookie flow (`@supabase/ssr`)
- pnpm

## Setup lokal

```bash
pnpm install
cp .env.example .env.local
```

Isi `.env.local` dari **Supabase Dashboard → Project Settings → API Keys**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Jalankan development server:

```bash
pnpm dev
```

Buka http://localhost:3000. Halaman `/login` sudah menyediakan flow masuk/daftar dan callback PKCE di `/auth/callback`.

## Database Supabase

Jalankan isi `supabase/migrations/0001_initial.sql` lewat **Supabase Dashboard → SQL Editor**. Migration ini membuat:

- tabel `public.profiles` yang terhubung ke `auth.users`;
- Row Level Security agar user hanya dapat membaca/mengubah profilnya sendiri;
- trigger untuk membuat profil otomatis saat user baru mendaftar.

Tambahkan URL berikut di **Authentication → URL Configuration → Redirect URLs**:

```text
http://localhost:3000/auth/callback
```

## Commands

```bash
pnpm dev       # development
pnpm lint      # lint
pnpm build     # production build check
pnpm start     # jalankan production build
```

## Struktur penting

```text
src/
├── app/
│   ├── auth/callback/route.ts  # tukar auth code menjadi session
│   ├── login/page.tsx           # UI login/register
│   └── page.tsx                 # landing page + status session
├── components/
│   └── auth-form.tsx
├── lib/supabase/
│   ├── client.ts                # browser client
│   ├── server.ts                # Server Components/Route Handlers
│   └── proxy.ts                 # refresh session cookies
└── proxy.ts                     # Next.js request proxy

supabase/migrations/0001_initial.sql
```
