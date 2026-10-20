# Production deployment

This guide prepares the existing Next.js 16.3.x / Payload 3.91.0 / PostgreSQL 16
application for a later VPS deployment. It does not authorize a deployment, DNS
change, database migration, or public notification test. Do not proceed with
public traffic until every required condition at the end of this document is met.

## Current audit and release blockers

- The project is a Next.js App Router application with Payload Admin at `/admin`,
  Payload REST routes at `/api/*`, the public pages in `app/`, and a dynamic CMS
  page at `app/[slug]/page.tsx`. Catalog content uses the `Services`, `Products`,
  `PriceItems`, and `Media` collections; additional collections include `Pages`,
  `FAQs`, `Users`, and `Leads`.
- Public visitors can read published catalog/page content. Payload collection
  create/update access is authenticated; `Leads` cannot be read anonymously and
  its standard public create/update/delete operations are closed. The public
  form uses the server-only `POST /api/leads` handler.
- The handler normalizes and validates fields, checks consent and a honeypot,
  caps request bodies at 8 KiB, saves the lead before attempting notifications,
  and records channel delivery status. An admin can retry failed notification
  channels on the existing lead. Telegram/email failures do not roll back a
  saved lead. There is no durable notification queue; retries are manual.
- PostgreSQL is configured through the Payload 3 Postgres adapter. Development
  schema push is enabled, but production automatic push is explicitly disabled.
  There is currently no `migrations/` directory or committed migration. A
  production database must not be used until migrations are created and tested
  against a disposable copy of the intended schema.
- Media uploads use the relative `media/` directory. Compose mounts it at
  `/app/media` in a named volume; the database uses a separate named volume.
- The current in-process lead rate limiter allows 5 requests per IP per 15
  minutes. It is deliberately bounded but is not shared across processes and
  resets on restart. Put a shared rate limit at the reverse proxy or a WAF/CDN
  before public launch. The app must only be reachable through a trusted proxy
  that overwrites `X-Real-IP`.
- The app's health endpoint performs a Payload/PostgreSQL readiness query.
  Docker Compose keeps PostgreSQL internal to its network except for an optional
  loopback-only `127.0.0.1:5433` development binding; it does not bind the DB
  port to a public interface.
- `.env` is ignored by Git. Never copy it into the image or print it to logs.
  `SITE_URL` is the canonical runtime URL. `NEXT_PUBLIC_SITE_URL` remains a
  compatibility fallback for existing local configurations.
- The npm lockfile is `package-lock.json` (lockfile version 3). `pnpm-lock.yaml`
  and `yarn.lock` are also present, but Docker uses the npm lockfile with `npm
  ci`. Do not update dependencies with a different package manager as part of a
  production deployment.
- Next.js was raised from 15.4.11 to 16.3.8 because the former had critical
  production audit advisories. Payload 3.91.0 declares peer support for Next
  `>=16.3.3 <17`; the installed Next 16.3.8 passed this project's production
  build. Sharp was updated to 0.35.5, and patched Sass/DOMPurify versions are
  pinned through npm overrides.
- `npm audit --omit=dev` no longer reports high/critical issues, but reports
  five moderate advisories in Payload Postgres adapter / Drizzle Kit / esbuild.
  The upstream dependency tree offers no compatible automatic fix at this
  audit. Full `npm audit` also reports high advisories in development-only
  Next ESLint tooling. The production image prunes dev dependencies; continue
  reviewing the upstream issues before using shared build infrastructure.

## 1. VPS and operating system

For the current single-site, single-instance design, start with:

- Ubuntu Server 24.04 LTS or another supported Linux distribution with security
  updates enabled.
- 2 vCPU, 4 GB RAM, and at least 40 GB SSD/NVMe storage. Increase storage for
  media and retained backups; monitor growth.
- A static public IPv4 address. IPv6 is optional if it is correctly configured.
- Docker Engine and the Docker Compose v2 plugin. Do not install Docker from an
  untrusted convenience script.
- SSH key authentication, a non-root operator account with controlled sudo,
  automatic security updates, and a host firewall.

This is a modest single-host setup: the app and database share the VPS and are
not highly available. Separate the database or add managed backup/monitoring
services if uptime, data volume, or recovery objectives require it. Do not expose
PostgreSQL to the public Internet.

## 2. Environment variables

Copy `.env.example` to `.env` on the VPS and restrict permissions (for example,
`chmod 600 .env`). Fill in values using a secret manager or secure operator
workflow. Never commit the completed file.

Required for the application and database:

| Variable | Purpose |
| --- | --- |
| `SITE_URL` | Canonical public site URL; production must use the final HTTPS origin, with no path. |
| `DATABASE_URL` | PostgreSQL URL. Compose overrides it inside the container to use `db:5432`; for host-based local development use `localhost:5433`. |
| `POSTGRES_PASSWORD` | Database password consumed by Compose. Prefer a URL-safe random value because Compose constructs the in-network URL from it. |
| `PAYLOAD_SECRET` | Persistent unique Payload signing/encryption secret, at least 32 characters. Generate it once using a cryptographically secure generator and preserve it securely. Do not rotate it casually: changing it can invalidate existing sessions/tokens. |

Optional notification integrations (leave unconfigured until controlled tests
are possible):

| Variable | Purpose |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API credential. |
| `TELEGRAM_CHAT_ID` | Controlled recipient chat/channel ID for lead notifications. |
| `SMTP_HOST`, `SMTP_PORT` | SMTP server and port (normally 587 with STARTTLS or 465 with TLS). |
| `SMTP_USER`, `SMTP_PASS` | SMTP authentication. |
| `EMAIL_FROM` | Verified sender address. |
| `LEADS_EMAIL_TO` | Controlled recipient for lead notifications. |

`NEXT_PUBLIC_SITE_URL` is retained only as a compatibility fallback. Set it to
the same origin as `SITE_URL` if a deployed instance still needs it. No other
external integrations are currently referenced by application code.

Example generation commands (run only on the target operator machine; these do
not create or install values in this repository):

```sh
openssl rand -hex 32
openssl rand -base64 48
```

Use the first output as a URL-safe database password and the second as the
Payload secret. Do not paste generated values into chat, source control, build
arguments, or shell command history.

## 3. Docker and Compose

The production Dockerfile uses three build stages, `npm ci`, Node 22 Alpine,
and a non-root `node` user. No environment file is copied into the build
context. The image validates the Payload secret before starting Next.js and
executes the Next.js process directly so it receives container signals.
Compose uses restart policies, a PostgreSQL healthcheck, an application
readiness healthcheck, and named volumes for PostgreSQL and media.

On the VPS, from the repository directory:

```sh
cp .env.example .env
chmod 600 .env
# Edit .env in a secure editor and set all required values.
docker compose build app
docker compose up -d db
docker compose ps
docker compose logs --tail=100 db
```

Do not run `docker compose up -d app` against a fresh/changed production schema
until the migration procedure below has completed. After migrations have been
created, reviewed, tested, backed up, and applied:

```sh
docker compose up -d app
docker compose ps
docker compose logs --tail=100 app
```

The app is bound to `127.0.0.1:3000` for a host-level reverse proxy. PostgreSQL
uses the internal Compose network; its optional `127.0.0.1:5433` port binding
is loopback-only and is not required by the app. Remove even that local binding
on a server if no host-side database tooling needs it.

Useful operational commands:

```sh
docker compose ps
docker compose logs -f --tail=200 app db
docker compose restart app
docker compose pull
docker compose build app
```

Use the project's npm lockfile and the exact reviewed source revision for every
release. Do not run the Next.js development server in production.

## 4. Domain, HTTPS, and reverse proxy

Do not apply DNS changes until the domain, VPS address, and proxy configuration
are confirmed by the operator. Replace these explicit placeholders:

- `<DOMAIN>` — the real domain selected for the site.
- `<VPS_IPV4>` — the actual VPS public IPv4 address.
- `<VPS_IPV6>` — the actual VPS IPv6 address, only if configured.

At the registrar/DNS provider, create the required A record for `<DOMAIN>` and
optionally an AAAA record for `<VPS_IPV6>`. Add `www` only if the site will
serve or redirect it. Wait for DNS propagation and verify records before
requesting a certificate; do not invent or reuse another server's address.

Use Caddy or Nginx as the TLS-terminating reverse proxy. For a host-installed
Caddy, a starting Caddyfile is:

```caddyfile
<DOMAIN> {
    reverse_proxy 127.0.0.1:3000 {
        header_up X-Real-IP {remote_host}
    }
}
```

Replace `<DOMAIN>` with the actual hostname before loading the file. Caddy
obtains and renews HTTPS certificates when DNS points to the VPS and ports 80
and 443 are reachable; it redirects HTTP to HTTPS automatically. Keep the
application port private/loopback-only. Set `SITE_URL=https://<DOMAIN>` and
`NEXT_PUBLIC_SITE_URL` to the same origin if the compatibility variable is
needed.

The lead endpoint requires an `Origin` matching the configured site origin in
production. It also requires a valid `X-Real-IP` supplied by the trusted proxy.
Never expose port 3000 directly or allow clients to choose this header. Add a
shared proxy/WAF rate limit for `POST /api/leads` and the Payload login routes
(`/api/users/login` and `/admin/login`); the application's memory limiter is a
secondary safeguard, not a durable or distributed control. Permit only the
required inbound ports (typically SSH, HTTP, and HTTPS) in the firewall.

## 5. PostgreSQL schema and migrations

Payload 3.91.0's Postgres adapter only pushes schema changes in non-production
mode when `push` is enabled. This project explicitly sets `push` off in
production and sets the migration directory to `migrations/`. Do not enable
production schema push and do not use `migrate:fresh`, `migrate:reset`, or
`migrate:refresh` on production data.

There is no migration checked into this repository yet. Before the first
production database is prepared:

1. Start with a disposable local/test PostgreSQL database, not the VPS
   production database.
2. Generate a migration using the installed Payload CLI:

   ```sh
   npx payload migrate:create
   ```

3. Review the generated SQL/TypeScript migration. Check that it preserves the
   current records and does not drop or rename live columns unexpectedly.
4. Apply it to a disposable database and verify the application, CMS, and all
   collections. Commit the reviewed migration.
5. Back up the target database and media before each production migration.
6. Apply only committed migrations to the intended database, then check status:

   ```sh
   docker compose run --rm --no-deps app npm run payload:migrate
   docker compose run --rm --no-deps app npx payload migrate:status
   ```

`docker compose run` uses the built application image and environment. Build
the new image first. Keep the old app available for an application rollback,
but assume a schema migration can make an old app incompatible. A migration
rollback is allowed only if its down migration has been reviewed and tested.
Otherwise restore a tested backup in a controlled maintenance window.

For the first schema, consider the existing data and currently running local
installation. Do not apply a generated migration to a database whose contents,
Payload version, or existing schema have not been inventoried.

## 6. Persistent data and backup

Compose creates separate named volumes for PostgreSQL (`postgres_data`) and
media uploads (`media_data`). Verify their actual names with
`docker volume ls` before using volume-level tools. Do not remove volumes during
an update. The application image is replaceable; these volumes are not.

For a consistent backup, schedule a maintenance window or otherwise prevent
content writes/uploads while both backups are taken. From the deployment
directory on the VPS:

```sh
umask 077
mkdir -p backups
stamp=$(date -u +%Y%m%dT%H%M%SZ)
docker compose exec -T db pg_dump -U payload -d funeral_site -Fc \
  > "backups/postgres-${stamp}.dump"
docker compose exec -T app tar -C /app -czf - media \
  > "backups/media-${stamp}.tar.gz"
test -s "backups/postgres-${stamp}.dump"
test -s "backups/media-${stamp}.tar.gz"
pg_restore --list "backups/postgres-${stamp}.dump" > /dev/null
tar -tzf "backups/media-${stamp}.tar.gz" > /dev/null
```

These checks only establish that the archive can be listed; they do not prove
that a recovery works. Copy encrypted backups off the VPS to a separate
provider/account or other independent storage, apply access controls and
retention, and monitor that each transfer completed. Never treat a backup on
the same VPS as disaster recovery.

Regularly test recovery in an isolated, disposable environment:

1. Create a fresh test PostgreSQL database and empty media directory/volume.
2. Set `TEST_DATABASE_URL` and `DUMP_FILE` to the isolated test database and
   dump path, then restore with
   `pg_restore --no-owner --dbname="$TEST_DATABASE_URL" "$DUMP_FILE"`. Do not
   use a production target.
3. Extract the media archive into the test media directory.
4. Start a test app using the restored database/media and a separate test
   `PAYLOAD_SECRET`. Verify admin login, catalog records, images, and a test
   lead. Disable notifications or use explicitly controlled test recipients.
5. Record the recovery time and any missing data. A backup is not verified
   until this restoration succeeds.

Database and media archives should be timestamped and retained as a matched
pair. If uploads or edits continue while the two commands run, restore may not
represent one exact point in time.

## 7. Telegram and email checks

The application records the lead before sending Telegram/email. If either
provider fails, it stores `failed`/`partial` channel status and retains the lead.
An authorized admin can retry unsent channels using the existing lead's
`retry-notifications` endpoint; already-sent channels are not sent again. This
is a manual retry, not an automatic durable queue.

Before enabling either integration, use a staging deployment or controlled
recipient account. Verify Telegram chat ID and SMTP sender/recipient ownership.
Never test with an actual customer's phone/email or send a test message to an
uncontrolled recipient. Do not share credentials in logs or shell transcripts.

## 8. Update and rollback procedure

1. Review the release diff, package lock, and migration. Run tests, typecheck,
   lint, and production build before preparing the image.
2. Put the site in a controlled maintenance window if the migration or backup
   requires writes to stop.
3. Take and verify PostgreSQL and media backups; confirm the off-site copies.
4. Build the new image from the reviewed source revision.
5. Apply the reviewed Payload migration and inspect migration status.
6. Start the new app and check health and application logs.
7. Perform the post-deploy checks below. Remove maintenance mode only after
   they pass.
8. If the app fails, return to the prior image only if it is compatible with
   the changed schema. Otherwise restore database and media backups into a
   controlled recovery environment and follow the approved recovery plan.

Do not use `docker compose down -v`, remove named volumes, or reset the
production database as a rollback strategy.

## 9. Post-deployment checks

After the operator has explicitly approved deployment:

- `docker compose ps` reports database and app healthy.
- `curl -fsS http://127.0.0.1:3000/api/health` succeeds from the VPS.
- The HTTPS site, canonical redirects, and certificate work from outside.
- `/admin` loads, and a designated administrator can authenticate.
- Public services, products, price list, and images load; unpublished records
  remain private.
- A clearly labeled test lead is stored exactly once in `Leads` and inaccessible
  to anonymous Payload REST/GraphQL reads.
- Telegram/email are tested only against controlled recipients; channel status
  and the admin retry path are verified.
- External port scans/firewall review confirm PostgreSQL and port 3000 are not
  publicly reachable.
- Docker healthchecks work and logs contain no credentials or unnecessary
  personal data.
- Image inspection confirms no `.env` or real credential was included. The
  image must be built only from a clean, reviewed context; this environment's
  current Docker image has not yet been inspected.
- A successful restore test exists for the current backup pair.

The app health endpoint checks application/DB readiness only; it does not prove
external notification delivery, public TLS, or CMS login.

Search indexing is intentionally disabled in both `app/robots.ts` and root
metadata (`noindex`). Keep this while content and legal pages are reviewed;
deliberately enable indexing after that review if public search visibility
is required.

## 10. Incident response

- **App unhealthy:** inspect `docker compose logs --tail=200 app`, recent release
  and health status. Check that the secret and `SITE_URL` are set without
  printing them. Roll back the image only if the schema remains compatible.
- **Database unhealthy:** inspect database logs, free disk space, volume
  availability, and connection settings. Do not recreate the database or
  remove its volume. Restore only through the approved recovery procedure.
- **Notification failure:** verify provider status, controlled recipient
  configuration, and the lead's delivery statuses. Preserve the lead and use
  the admin retry endpoint; do not resubmit the public form to trigger another
  lead.
- **Suspected credential exposure:** revoke/rotate the affected integration
  credential, update the protected secret store, and review access/logs.
  Changing `PAYLOAD_SECRET` requires a session/token impact plan.
- **Suspected data loss:** stop writes if safe, preserve the current volumes and
  logs, and restore a matched backup pair into an isolated environment before
  changing production data.

## Mandatory conditions before public launch

- Select and harden the VPS; confirm actual domain and IP details.
- Decide whether to enable search indexing after approving public content and
  legal pages; it is currently disabled intentionally.
- Create and test Payload migrations for the intended starting schema. This
  repository currently has none.
- Configure a trusted HTTPS proxy that overwrites `X-Real-IP`, plus shared
  rate limiting/WAF protection for the lead endpoint and Payload login routes.
- Provide persistent production secrets, database password, canonical HTTPS
  URL, and controlled Telegram/SMTP recipients through a secret manager or a
  permission-restricted environment file.
- Verify off-site backups by restoring both PostgreSQL and media in a test
  environment.
- Run a deployment rehearsal, including admin access, catalog/media reads, a
  test lead, and notification retries with controlled recipients.
- Review consent/privacy wording, retention/access policy for personal data,
  firewall rules, and monitoring/alerting.

No VPS, DNS, HTTPS certificate, production database, external backup, admin
login, or real notification has been provisioned or tested as part of this
preparation.
