# Grimm Dominion Agent Guide

## Repository Structure
- `Design_Document/Design_Document`: Primary game design reference (PDF). Keep it unchanged unless a new authoritative design is provided.
- `docs/prototype/`: Planning hub for the browser-based vertical slice. Each Markdown file drills into a specific discipline:
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
  - Follow TypeScript/Phaser conventions: PascalCase for classes, camelCase for locals/parameters, and
    co-locate modules under `web/src/<Feature>`.
  - Document public APIs with TSDoc comments. Group related gameplay systems under
    `web/src/game/systems/<Feature>`.
  - Avoid `try/catch` around imports (per global instructions).
- For JSON/YAML configs, use two-space indentation and double quotes for keys/strings.

## Testing Protocols
- Documentation changes: No automated tests required; proofread for clarity and broken links.
- Browser gameplay code:
  - Run `npm run lint --prefix web` and `npm run test --prefix web` before committing.
  - Use `npm run test:e2e --prefix web` when modifying Playwright flows.
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
