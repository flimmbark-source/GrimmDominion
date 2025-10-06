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

## Telemetry & Analytics
- Capture match length, role selection, win/loss, resource income rates, and objective completion times.
- Use Unity Analytics or custom lightweight pipeline posting JSON to AWS API Gateway.
- Privacy compliant; collect no PII, only anonymized session IDs.

## QA & Testing
- Automated play mode tests for resource accrual, quest completion, and AI state transitions.
- Performance capture harness to log FPS, memory, and CPU usage during scripted scenarios.
- Network soak tests with bots simulating hero actions to validate stability.
