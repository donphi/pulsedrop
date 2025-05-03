# TECH_STACK.md

## Core Technologies

- **Framework:**  
  - **Next.js (App Router)** – React Server Components enabled  
  - **TypeScript** – Strict mode enabled (`strict: true`)

- **Styling:**  
  - **Tailwind CSS** – Config in `tailwind.config.js`  
  - **Global CSS variables** – Defined in `styles/globals.css`

- **Backend/Data Layer:**  
  - **Supabase** – Auth, Database (PostgreSQL), Storage  
  - **Strava API** – OAuth integration, data retrieval

- **Authentication:**  
  - **NextAuth.js** – Integrated with Supabase and Strava OAuth

- **State Management:**  
  - **React Context API / Hooks**

- **CI/CD & Containerization:**  
  - **Docker** – Minimal, secure, and non-root container images  
  - **Vercel** – Zero-downtime deployment via GitHub Actions CI/CD

---

## Project File Structure & Configurations

### Centralized Configuration

All non-sensitive configuration (e.g., menu definitions, paths, UI constants) **MUST** reside in:

```
/lib/config.ts
```

### Tailwind and CSS variables Configuration

- Tailwind Config: `/tailwind.config.js`
- Global CSS Variables: `/styles/globals.css`

### Authentication Configuration

- NextAuth: `/lib/auth.ts`
- Supabase Client: `/lib/supabaseClient.ts`

### Project Structure

```
├── app/
│   ├── (dashboard)/
│   ├── (auth)/
│   └── layout.tsx
├── components/
│   ├── layouts/
│   ├── ui/
│   └── auth/
├── lib/
│   ├── config.ts
│   ├── supabaseClient.ts
│   └── auth.ts
├── styles/
│   └── globals.css
├── public/
└── Dockerfile
```

```
NEVER hardcode values. Always use variables from `/lib/config.ts`.
```