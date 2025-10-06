#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/workspaces/GrimmDominion"
WEB_DIR="${REPO_DIR}/web"
if [[ -d /workspaces ]]; then
  git config --global --add safe.directory "$REPO_DIR"
fi

if command -v git-lfs >/dev/null 2>&1; then
  git lfs install --local
  git lfs fetch --all || true
  git lfs checkout || true
fi

if [[ -f "${WEB_DIR}/package.json" ]]; then
  pushd "${WEB_DIR}" >/dev/null
  npm install
  popd >/dev/null
fi

cat <<'MSG'
Codespace setup complete.
Key npm scripts:
  npm run dev -- --host 0.0.0.0 --port 5173
  npm run test
  npm run build
Review docs/prototype/technology.md for workflow details.
MSG
