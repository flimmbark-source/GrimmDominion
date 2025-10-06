#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/workspaces/GrimmDominion"
UNITY_LICENSE_DIR="${HOME}/.local/share/unity3d/Unity"
PHOTON_REGISTRY="https://package.registry.photonengine.com"

if [[ -d /workspaces ]]; then
  git config --global --add safe.directory "$REPO_DIR"
fi

git lfs install --local
if git lfs env >/dev/null 2>&1; then
  git lfs fetch --all || true
  git lfs checkout || true
fi

if [[ -n "${PHOTON_UPM_TOKEN:-}" ]]; then
  mkdir -p "${HOME}/.upm"
  cat > "${HOME}/.upm/upmconfig.toml" <<TOML
[npmAuth."${PHOTON_REGISTRY}"]
token = "${PHOTON_UPM_TOKEN}"
alwaysAuth = true
TOML
fi

if [[ -n "${UNITY_LICENSE_CONTENT:-}" ]]; then
  mkdir -p "${UNITY_LICENSE_DIR}"
  echo "${UNITY_LICENSE_CONTENT}" > "${UNITY_LICENSE_DIR}/Unity_lic.ulf"
  chmod 600 "${UNITY_LICENSE_DIR}/Unity_lic.ulf"
fi

if [[ -n "${UNITY_SERIAL:-}" ]]; then
  cat > "${REPO_DIR}/.codespace-unity-env.example" <<ENV
UNITY_SERIAL=${UNITY_SERIAL}
UNITY_EMAIL=${UNITY_EMAIL:-}
UNITY_PASSWORD=${UNITY_PASSWORD:-}
ENV
fi

echo "Codespace setup complete. Review docs/prototype/technology.md for workflow details."
