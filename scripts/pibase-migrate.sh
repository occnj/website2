#!/usr/bin/env bash
# Apply the website's database schema to a PIBASE project, in order.
# Run on the PIBASE server from the pibase folder (/home/pibase/pibase):
#
#   /path/to/website2/scripts/pibase-migrate.sh PROJECT_ID
#
# Each file is applied with PIBASE's `migration-apply`, which records it by name
# and checksum, so re-running skips files that are already applied.
# See docs/pibase.md.
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "usage: $0 PROJECT_ID   (run from the pibase folder)" >&2
  exit 2
fi
project="$1"
db="$(cd "$(dirname "$0")/../db" && pwd)"
[ -f compose.yaml ] || { echo "run this from the pibase folder (where compose.yaml is)" >&2; exit 1; }

# A Pi or droplet runs the server layout (same check as scripts/create-project.sh).
if [ -z "${COMPOSE_FILE:-}" ] && ! grep -q '^COMPOSE_FILE=' .env 2>/dev/null; then
  root="$(sed -n 's/^PIBASE_DATA_ROOT=//p' .env 2>/dev/null | tail -1)"
  if [ -d "${root:-/srv/pibase}/postgres" ]; then
    export COMPOSE_FILE=compose.yaml:compose.pi.yaml
  fi
fi

files=(
  pibase/000-setup.sql
  migrations-2026-07.sql
  overrides.sql
  migrations-2026-08-contact-faq-podcast.sql
  migrations-2026-08-hero-video.sql
  migrations-2026-08-ministries.sql
  migrations-2026-08-ministry-overlay.sql
  migrations-2026-08-post-slugs.sql
  migrations-2026-08-post-gallery.sql
  migrations-2026-08-team-sections.sql
  migrations-2026-08-ministries-nav.sql
  migrations-2026-09-about-content.sql
  migrations-2026-10-change-approval.sql
  pibase/100-storage-rules.sql
  migrations-2026-10-redesign.sql
)

for f in "${files[@]}"; do
  name="$(basename "$f" .sql)"
  echo "== $name"
  docker compose run --rm -T gateway migration-apply "$project" "oasis-$name" < "$db/$f"
done
echo "All website migrations applied to project $project."
