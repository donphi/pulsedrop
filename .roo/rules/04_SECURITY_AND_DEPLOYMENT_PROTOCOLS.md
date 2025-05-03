# SECURITY_AND_DEPLOYMENT_PROTOCOLS.md

## Security Standards

### Input Validation
- Rigorously validate/sanitize all inputs using established libraries.
- Prevent SQL Injection, XSS, and other injection attacks.

### Authentication & Authorization
- Use NextAuth.js integrated securely with Supabase and Strava.
- Strictly enforce access rules at API and database layers.

### Data Protection
- Never expose sensitive data (emails, tokens, IDs).
- Ensure compliance with GDPR and other relevant privacy regulations.

### Dependency Security
- Regularly audit and promptly update npm packages.
- Address vulnerabilities immediately upon discovery.

### Secure Error Handling
- Use generic user-facing errors; detailed logs internally only.
- NEVER expose stack traces or sensitive errors to clients.


---

## Deployment & Containerization Standards

### Configuration Isolation
- All sensitive information (e.g., API keys, DB URLs) must be stored in `.env`. Use `.env.template` to define required keys.
- All non-sensitive configuration (e.g., nav links, paths, UI options) must be stored in `/lib/config.ts`.
- Never commit `.env` — always use `.env.template` for shared structure.
- No credentials or sensitive values in the codebase.

### Logging & Observability
- Implement structured logging (JSON) without sensitive information.
- Clearly log necessary context for debugging.

### Error Recovery & Handling
- Gracefully handle errors to prevent cascading failures.
- Ensure high availability, especially critical paths.

### Container Security & Performance
- Docker images: minimal base images, non-root users, and vulnerability scans.
- Define clear CPU and memory constraints.

### Zero-Downtime Deployments
- CI/CD pipelines via GitHub Actions to Vercel must implement zero-downtime strategies (canary or blue-green).
- Automated rollback on critical failures.