# Grimm Dominion Agent Guide

## Repository Structure
- `Design_Document/Design_Document`: Primary game design reference (PDF). Keep it unchanged unless a new authoritative design is provided.
- `docs/prototype/`: Planning hub for the vertical slice prototype. Each Markdown file drills into a specific discipline:
  - `README.md`: Entry point linking the specialist documents below.
  - `vision.md`: Goals, success metrics, and scope guardrails.
  - `roles.md`: Dark Lord and hero role loops, including economy notes.
  - `systems.md`: Core gameplay systems (stealth, resources, AI, etc.).
  - `world.md`: Map structure, scripted content, and encounter pacing.
  - `ux.md`: Control schemes, HUD expectations, and UX heuristics.
  - `art_audio.md`: Visual tone, VFX/SFX beats, and pipeline guidelines.
  - `technology.md`: Target platforms, networking model, and telemetry plan.
  - `roadmap.md`: Milestones for building the prototype.

Add new documentation under `docs/` with topical subfolders and cross-link them from the relevant README.

## Coding & Documentation Conventions
- Prefer Markdown (`.md`) for design and planning artifacts. Use level-1 headings for file titles and level-2 headings for top-level sections.
- Wrap lines at ~100 characters for readability. Use bullet or numbered lists for structured content.
- When adding code in future sprints:
  - Follow Unity C# conventions: PascalCase for types/methods, camelCase for locals/parameters, `I`-prefixed interface names.
  - Keep public APIs documented with XML comments. Group related scripts under `Assets/Scripts/<Feature>`.
  - Avoid `try/catch` around imports (per global instructions).
- For JSON/YAML configs, use two-space indentation and double quotes for keys/strings.

## Testing Protocols
- Documentation changes: No automated tests required; proofread for clarity and broken links.
- Unity gameplay code (when present):
  - Run play mode/unit tests via `Unity -runTests -testPlatform editmode` before committing.
  - Use `dotnet test` for standalone C# projects or tooling.
- If introducing build scripts or pipelines, document command usage in the relevant README and reference them in commit messages.

## Pull Request Guidelines
- Provide a concise title using imperative mood (e.g., "Add dark lord spawn logic").
- In the summary section, enumerate key changes as bullet points grouped by theme or subsystem.
- Call out any follow-up work, risk areas, or dependencies.
- In the testing section, list every command run with pass/fail status; note when no automated tests were applicable.
- Attach or reference relevant documentation updates, screenshots, or telemetry as needed.

## Communication Notes
- Maintain cross-links between prototype docs when new systems touch multiple disciplines.
- Surface open questions or assumptions as `> **Open Question:**` callouts so they are easy to track.
