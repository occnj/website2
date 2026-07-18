# Security and credential handling

## Credential rules

- `RESEND_API_KEY` and `SUPABASE_SECRET_KEY` are server-only. They belong
  only in the server `.env.local` and must never use a `NEXT_PUBLIC_` prefix.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are browser
  configuration. The anon key is visible to every visitor by design; Supabase
  Row-Level Security is the security boundary.
- Never commit `.env`, `.env.local`, private keys, access tokens, passwords, or
  provider dashboard exports. `.gitignore` blocks all `.env*` files except the
  empty `.env.example` template.
- Run `npm run security:scan` before every push. An Actions workflow template is
  provided at `docs/security-workflow.example.yml`; install it as
  `.github/workflows/security.yml` using a GitHub credential with `workflow` scope.

## July 2026 Resend exposure response

The former Resend key appeared in Git history and must be considered compromised.
Deleting it from source does not make that key safe again.

1. Create a new **Sending access** key restricted to the website&apos;s sending domain.
2. Put the replacement only in the production server `.env.local`, deploy, and
   verify a test form appears under the new key in Resend logs.
3. Delete the exposed key immediately after the replacement is verified. Resend
   keys do not expire automatically.
4. Review Resend sending logs and domain activity from the first exposed commit
   through the revocation time; investigate unfamiliar recipients or volume.
5. Rewrite Git history only after key revocation and coordinating with every
   clone/fork. History rewriting requires a force-push and all collaborators must
   re-clone or reset to the rewritten branch.

## Supabase verification

- Prefer Supabase&apos;s current publishable (`sb_publishable_…`) and secret
  (`sb_secret_…`) keys. Legacy anon/service-role environment names remain accepted
  temporarily for deployment migration.
- Rotate the secret/service-role key if it was ever copied into source, chat,
  logs, or a browser-facing variable. This scan found no tracked server key value.
- Keep public signup disabled unless intentionally needed.
- Verify RLS is enabled on every public-schema table and storage bucket.
- Test access with anon, editor, events-only, admin, and owner roles after policy changes.
- Review Auth logs and database logs for unexpected sign-ins or writes.
