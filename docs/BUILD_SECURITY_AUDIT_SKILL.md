# Instructions for Claude Code — Build the Security Audit Skill

You are to generate a new Claude Code skill named **`security-audit`**. This file is the brief; it is not the skill itself. Your deliverable is a `SKILL.md` file that conforms to the Anthropic skills format and the requirements below.

---

## 1. Goal

Produce a plug-and-play skill that enables Claude Code to perform a thorough static security audit on any web codebase using the tech stack described in §3. The skill must be reusable across multiple projects with similar stacks without modification.

---

## 2. Deliverable

- **File path:** `.claude/skills/security-audit/SKILL.md` (project-scoped) OR `~/.claude/skills/security-audit/SKILL.md` (global). Ask the user which scope they want before writing.
- **Format:** Markdown with YAML frontmatter at the top.
- **Frontmatter requirements:**
  - `name: security-audit`
  - `description:` — a single paragraph that (a) describes what the skill does and (b) lists trigger phrases so Claude Code auto-loads it. Include verbs like "audit", "review security", "find vulnerabilities", "harden", "pentest", "scan for secrets", "check OWASP", and make it lean slightly pushy (skills tend to under-trigger). Mention the stack keywords (Next.js, NestJS, Express, NextAuth, MongoDB, PostgreSQL, Supabase, Vercel, Railway) so stack-related audit requests match.
- **Body length target:** 400–600 lines of Markdown. If you need more, split extra detail into `references/*.md` files under the skill folder and link them from SKILL.md rather than bloating the main file.

---

## 3. Stack Context

The skill must be tailored to this stack. Do not write generic OWASP content — every check must map to something a reader would actually encounter in a repo using these tools.

- **Frontend:** Next.js (App Router and Pages Router both possible), deployed to Vercel.
- **Backend:** NestJS or Express.js (assume either or both may be present), deployed to Railway.
- **Authentication:** NextAuth.js.
- **Databases:** MongoDB (via Mongoose or the native driver), PostgreSQL (Railway-hosted, via Prisma / Drizzle / `pg`), Supabase.
- **Language:** TypeScript primarily; JavaScript fallback.
- **Package managers:** npm, pnpm, or yarn.

---

## 4. Required Sections (in this order)

The generated SKILL.md must contain these sections. Use your judgment on exact headings, but every listed topic must be covered with concrete, actionable content.

1. **Purpose & Scope.** What the skill audits and what it explicitly does not (no live pentesting, no network-layer testing).
2. **Audit Workflow.** A phased, ordered procedure Claude Code must follow:
   - Phase 0: repo inventory and stack detection.
   - Phase 1: secret/credential scan (run first, fail fast).
   - Phase 2: dependency audit (`npm audit` / `pnpm audit` / `yarn audit`, plus `osv-scanner` if available).
   - Phase 3: stack-specific audits (see §5).
   - Phase 4: OWASP Top 10 (2021) mapping.
   - Phase 5: report generation.
3. **Stack-Specific Audit Sections.** See §5.
4. **OWASP Top 10 Mapping Table.** Map each OWASP 2021 category (A01–A10) to concrete manifestations in this specific stack and the files/locations to look in.
5. **Secrets & Environment Variables.** Patterns to find committed secrets; required remediation steps (rotate → purge from git history → move to platform secret store → add pre-commit hook).
6. **Risk Severity Classification.** Define Critical / High / Medium / Low / Informational with concrete examples from this stack. Include an escalation rule (e.g., remotely exploitable without auth → automatic Critical).
7. **Reporting Format.** A complete Markdown report template the audit produces. Must include: executive summary with severity counts, per-finding entries (ID, OWASP category, file:line, description, evidence snippet, impact, remediation snippet, references, effort), dependency audit table, deployment review, remediation roadmap grouped by urgency, and an appendix listing commands run.
8. **Recommended Tools.** ripgrep, semgrep, gitleaks, trufflehog, osv-scanner, `eslint-plugin-security`, `eslint-plugin-no-unsanitized`, `helmet`, `@nestjs/throttler`, `class-validator`, `zod`, `argon2`/`bcrypt`, `mongo-sanitize`. Briefly explain what each is for.
9. **Quick Reference Command Block.** A single copy-pasteable shell block Claude Code can run at the start of every audit.
10. **Operating Notes for Claude Code.** Non-negotiable behavioral rules (see §7).

---

## 5. Stack-Specific Audit Requirements

For **each** of the subsections below, include: (a) a checklist of things to verify, (b) detection patterns using `rg` (ripgrep) or shell commands, (c) at least one "vulnerable example → fixed example" TypeScript/JavaScript snippet pair. Keep the snippets small and realistic.

### 5.1 Next.js (Frontend)
Cover at minimum: security headers via `headers()` in `next.config.js`; `poweredByHeader: false`; CSP without `'unsafe-inline'`/`'unsafe-eval'`; `dangerouslySetInnerHTML` without sanitization; secrets leaked via `NEXT_PUBLIC_*`; input validation in Route Handlers / Server Actions / `getServerSideProps` using Zod/Yup/Valibot; `next/image` `remotePatterns` not wildcarded; open redirects via `router.push(userInput)`; middleware auth enforcement; `target="_blank"` without `rel="noopener noreferrer"`; client-side `eval` / `new Function`.

### 5.2 NestJS / Express (Backend)
Cover at minimum: `helmet` enabled; CORS with explicit allowlist (NOT `origin: true` or `*` with credentials in prod); global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`; DTOs with `class-validator`; rate limiting (`@nestjs/throttler` / `express-rate-limit`); body size limit; command injection via `exec`/`spawn({ shell: true })`; JWT verification correctness (strong secret ≥ 32 bytes, validates `iss`/`aud`/`exp`); no verbose errors in production; logs stripped of PII/tokens; explicit `@UseGuards`/middleware on every protected route; file upload validation (MIME + magic bytes + size + storage location); prototype pollution on merge/clone of untrusted objects.

### 5.3 NextAuth (Authentication)
Cover at minimum: `NEXTAUTH_SECRET` strength and presence per environment; `NEXTAUTH_URL` correctness; session strategy choice (`jwt` vs `database`) and `session.maxAge`; cookie flags (`httpOnly`, `secure`, `sameSite`); `callbacks.signIn` allowlists; `callbacks.jwt`/`callbacks.session` not leaking internal fields; `callbacks.redirect` blocking off-origin URLs (open redirect); credentials provider using `bcrypt`/`argon2` (never MD5/SHA1/plain compare); login rate limiting and lockout; email-verification and password-reset token properties (single-use, short TTL, cryptographically random); CSRF protection verification. Include the open-redirect vulnerable/fixed snippet pair explicitly.

### 5.4 Databases

**MongoDB:** connection string from env; TLS enabled; user input never passed raw to query operators (NoSQL injection via `{ $ne: null }`); `mongo-sanitize` or strict typing; no `$where`; least-privilege DB user; backups; encryption at rest for PII.

**PostgreSQL (Railway / self-hosted):** parameterized queries only (no string concatenation); ORM usage (Prisma/Drizzle/TypeORM) or `pg` with `$1, $2` placeholders; reviewed migrations; RLS on multi-tenant tables; least-privilege DB role (not SUPERUSER); `sslmode=require`; bounded connection pool; audit logging. Flag `$queryRawUnsafe` and `sql.unsafe` usage.

**Supabase:** RLS enabled on every public-schema table (include the verification SQL); policies cover SELECT/INSERT/UPDATE/DELETE explicitly; `service_role` key is server-side only (grep client code for it); only `anon` key shipped to the browser; Storage bucket RLS; Edge Functions re-check authorization; cautious use of `SECURITY DEFINER` functions.

### 5.5 Deployment Environments

**Vercel:** env vars set per-environment in the dashboard, not committed; Preview deployments segregated from Production secrets; password-protected staging where appropriate; `vercel.json` headers don't weaken security; serverless memory/timeout sensible; no PII in URL path params (which end up in logs).

**Railway:** secrets in Railway Variables (not in `Dockerfile` or committed `.env`); service-to-service traffic on private networking; database not publicly exposed unless necessary (with allowlist if it is); healthcheck doesn't leak build/version info to unauthenticated callers; backups configured.

Include a detection pattern that finds committed `.env*` files (excluding `.env.example` / `.env.sample`) and flags secrets in Dockerfiles.

---

## 6. Detection Pattern Quality Bar

Every detection pattern in the skill must be:
- **Runnable as-is.** Use `rg` (ripgrep) syntax. Include `--glob '!node_modules'` and similar noise filters.
- **Low false-positive.** Prefer specific patterns (e.g., `NEXT_PUBLIC_.*(SECRET|KEY|TOKEN|PASSWORD)`) over broad ones.
- **Paired with meaning.** Immediately explain what a match indicates and when it might be a false positive.

If a tool-based check is more accurate than a regex (e.g., `semgrep --config auto` for prototype pollution), recommend the tool instead of writing a fragile regex.

---

## 7. Operating Notes — Non-Negotiable Rules

The skill's final section must bind Claude Code to these behaviors when running the audit:

1. **Produce a report; do not modify code** unless the user explicitly says "fix it" or "apply the fixes".
2. **Never print full secret values.** If a secret is discovered, show its location and first/last 4 characters only. Recommend rotation immediately.
3. **Do not run `trufflehog` in verification mode (`--only-verified`) without permission** — it hits live APIs and can tip off attackers or trigger alerts on third-party services.
4. **Respect scope.** If the user asks for a narrow audit (e.g., "just the auth layer"), run only the relevant §5 subsections — but always run the Phase 1 secret scan regardless, because leaked secrets are always urgent.
5. **Do not invent findings.** When uncertain, mark as **Informational — Requires manual review** rather than assigning a higher severity speculatively.
6. **Group duplicates.** If ten controllers all miss `@UseGuards`, that's one finding with a file list, not ten separate entries.
7. **Cite authoritative references** (CWE IDs, GHSA advisories, OWASP links) on each finding where applicable.

---

## 8. Style & Formatting Rules

- Use checklists (`- [ ]`) for verification steps.
- Use fenced code blocks with language tags (` ```ts `, ` ```bash `) for all snippets.
- Use tables for the OWASP mapping and severity classification.
- No marketing language, no filler. Every sentence should be operational.
- Assume the reader is Claude Code running unattended. Instructions must be unambiguous.

---

## 9. Before You Write

1. Confirm with the user:
   - Skill scope: project-local (`.claude/skills/...`) or global (`~/.claude/skills/...`).
   - Whether the current repo already contains any of the stack components so you can tune the opening example commands.
2. Check if a `security-audit` skill already exists at the target path. If so, ask whether to overwrite, update in place, or create under a new name.

---

## 10. After You Write

1. Show the user the final file tree of what you created (just the paths, not the full contents).
2. Provide one example trigger phrase they can try (e.g., "Audit this repo for security issues") to confirm the skill loads.
3. Remind them that the skill only runs a static audit and does not modify code without explicit instruction.

---

## 11. Acceptance Criteria

The generated skill is considered complete when:

- [ ] `SKILL.md` exists at the agreed path with valid YAML frontmatter.
- [ ] Frontmatter `description` includes trigger phrases AND the stack keywords.
- [ ] All ten sections from §4 are present and non-empty.
- [ ] Every §5 subsection includes a checklist, at least two detection patterns, and at least one vulnerable/fixed snippet pair.
- [ ] The reporting template in §7-of-the-skill can be filled in mechanically by a reader with no extra context.
- [ ] The Quick Reference Command Block (§9-of-the-skill) runs end-to-end without edits on a typical Node.js repo (graceful fallback if `semgrep`/`gitleaks` not installed).
- [ ] Operating Notes (§10-of-the-skill) include all seven rules from §7 of this brief.

---

**End of brief. Generate the skill now.**
