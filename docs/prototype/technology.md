# Technology & Infrastructure

## Engine & Platform
- Unity 2022 LTS with URP for mobile optimization.
- Photon Fusion for authoritative server-hosted simulation with client prediction.
- Target platforms: Android (OpenGL ES 3.0) and iOS (Metal).

## Architecture Overview
- **Server Authoritative:** Dedicated host handles AI, Fog of War, resource management, and match state. Clients run prediction for movement and ability execution.
- **Networking:** Tick rate 20Hz, delta compression on state updates, reliable RPCs reserved for objective triggers.
- **Procedural Generation:** Chunk selection seeded from match ID, server builds navmesh and transmits chunk metadata to clients on load.

## Tooling & Pipelines
- ScriptableObject-based data definitions for units, abilities, quests.
- Behavior Designer (or custom node editor) for minion behavior trees.
- Addressables for streaming art assets and patching content without full client updates.
- CI pipeline via GitHub Actions building Android/iOS dev builds nightly, running unit tests and integration smoke tests.

## Codespaces Environment
- Launch the repository in GitHub Codespaces using the provided `.devcontainer` definition, which
  pulls the `ghcr.io/game-ci/unity3d:ubuntu-2022.3.21f1-base-3.0` image so the Unity 2022.3.21f1
  editor and URP toolchain match the project baseline. The container installs the C# and Unity
  debugger extensions and configures the workspace as a trusted Git directory.
- On first boot the `post-create.sh` hook enables Git LFS, fetches tracked assets, and (when a
  `PHOTON_UPM_TOKEN` secret is provided) writes `~/.upm/upmconfig.toml` so Unity can authenticate to
  the Photon scoped registry for `com.photon.fusion.stub`.
- Supply Unity license credentials as Codespaces secrets—either set `UNITY_LICENSE_CONTENT` with the
  serialized `.ulf` text or provide `UNITY_SERIAL`, `UNITY_EMAIL`, and `UNITY_PASSWORD` so the script
  can emit `.codespace-unity-env.example` for manual activation. The resulting license is stored
  under `${HOME}/.local/share/unity3d/Unity/Unity_lic.ulf`.
- Mirror CI operations locally by running the same batch mode commands outlined in the GitHub
  Actions workflow (e.g., edit mode tests and Addressables builds) after `post-create` completes.
  Environment variables such as `UNITY_LICENSE_CONTENT`, `UNITY_SERIAL`, and `PHOTON_UPM_TOKEN`
  persist across terminals inside the Codespace, enabling headless builds.

## Telemetry & Analytics
- Capture match length, role selection, win/loss, resource income rates, and objective completion times.
- Use Unity Analytics or custom lightweight pipeline posting JSON to AWS API Gateway.
- Privacy compliant; collect no PII, only anonymized session IDs.

## QA & Testing
- Automated play mode tests for resource accrual, quest completion, and AI state transitions.
- Performance capture harness to log FPS, memory, and CPU usage during scripted scenarios.
- Network soak tests with bots simulating hero actions to validate stability.
