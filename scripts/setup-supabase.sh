#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v npx >/dev/null 2>&1; then
  echo "npx is required but not found."
  exit 1
fi

PROJECT_REF="${SUPABASE_PROJECT_REF:-}"
if [ -z "$PROJECT_REF" ] && [ -f ".env.local" ]; then
  PROJECT_REF="$(python - <<'PY'
from pathlib import Path
import re
p = Path('.env.local')
t = p.read_text(encoding='utf-8', errors='ignore') if p.exists() else ''
m = re.search(r'^NEXT_PUBLIC_SUPABASE_URL=(.+)$', t, re.M)
if not m:
    print('')
    raise SystemExit
url = m.group(1).strip().strip('"').strip("'")
mm = re.search(r'https?://([^.]+)\.supabase\.co', url)
print(mm.group(1) if mm else '')
PY
)"
fi

if [ -z "$PROJECT_REF" ]; then
  echo "SUPABASE_PROJECT_REF is missing and could not be derived from .env.local."
  exit 1
fi

echo "Linking to Supabase project: $PROJECT_REF"
npx supabase link --project-ref "$PROJECT_REF"

echo "Applying schema from supabase/schema.sql"
npx supabase db query --linked --file supabase/schema.sql

echo "Verifying required tables"
npx supabase db query --linked "select to_regclass('public.posts') as posts, to_regclass('public.comments') as comments, to_regclass('public.post_likes') as post_likes, to_regclass('public.comment_likes') as comment_likes;"

echo "Supabase setup complete. Refresh /protected in the app."
