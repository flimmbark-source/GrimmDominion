# Prototype File Creation Checklist

## Purpose
This checklist translates the vertical slice blueprint into concrete Unity project files so the
prototype can boot, connect players, and deliver the outlined match flow. Treat each item as a
tracked task in your project board and link completed assets back to their owning discipline.

## Project Bootstrapping
1. **Create Unity Project** using *Unity 2022 LTS (URP template)*.
2. **Configure Source Control**
   - Enable *Visible Meta Files* and *Force Text* serialization.
   - Add Git LFS for future binary art/audio drops.
3. **Install Required Packages** via Package Manager
   - Universal Render Pipeline, Input System, Cinemachine.
   - Photon Fusion SDK and Addressables.
   - Behavior tree tooling (Behavior Designer or custom) for AI scripting.
4. **Set Up Folder Structure** under `Assets/`
   - `Scenes/`, `Scripts/`, `Art/`, `Audio/`, `UI/`, `Prefabs/`, `ScriptableObjects/`, `NetCode/`,
     `Tests/`.
   - Mirror structure in `Assets/AddressableAssets/` for streamed content.

## Scenes & Game Flow Assets
- `Assets/Scenes/Boot.unity`: loads services, handles build hash checks, transitions to Lobby.
- `Assets/Scenes/Lobby.unity`: role selection UI, Photon room creation, match start countdown.
- `Assets/Scenes/CastlePlateau_VSlice.unity`: main match scene stitching castle plateau + three
  biome chunks with navmesh baking hooks.
- **Scene Script Files**
  - `Scripts/Boot/BootFlowController.cs`: orchestrates service initialization.
  - `Scripts/Lobby/LobbyUIController.cs`: binds Input System to role selection widgets.
  - `Scripts/Match/MatchBootstrap.cs`: requests chunk layout seed and instantiates gameplay
    managers.
- **Addressable Profiles**
  - Define *Editor*, *Android*, *iOS* profiles with build/load paths for streamed bundles.

## Scriptable Object Data
Create the following ScriptableObject definitions and populate at least one instance for the slice.

| File | Location | Purpose |
| --- | --- | --- |
| `AbilityDefinition.cs` | `Scripts/Data/` | Configures ability costs, cooldowns, FX references. |
| `UnitDefinition.cs` | `Scripts/Data/` | Stats for heroes/minions, including nav agent radius. |
| `QuestDefinition.cs` | `Scripts/Data/` | Quest steps, triggers, reward hooks. |
| `ResourceCurve.cs` | `Scripts/Data/` | Economy income/expense curves per role. |
| `ChunkLayoutDefinition.cs` | `Scripts/Data/` | Lists biome chunk prefabs, spawn markers. |

Store instances under `ScriptableObjects/Abilities`, `.../Units`, etc. Reference them from role
controllers and quest managers to avoid hard-coded data.

## Prefabs & Environment Assembly
- **Heroes**: `Prefabs/Heroes/ExiledKnight.prefab`, `.../GoblinOutlaw.prefab` containing character
  controller, ability harness, animation placeholders, and Photon network object.
- **Dark Lord Commander**: `Prefabs/DarkLord/CommanderRig.prefab` with camera rig, UI anchors,
  command selection widgets.
- **Minions**: skeletons, imps, bonecrusher prefabs with behavior tree component, nav agent, health.
- **Interactive Props**: gate, shrine, villager cages, gold caches, tavern, ritual node prefabs with
  collider, interaction script, and Addressable labels.
- **Biome Chunks**: blockout prefab variants per biome, including spawn markers (`Empty` child
  transforms) for objectives and AI.

## Systems & Gameplay Scripts
Create the following C# files under `Assets/Scripts/`:

- `Systems/FogOfWar/FogService.cs`, `Systems/FogOfWar/FogRenderer.cs`: manage visibility masks and
  render textures.
- `Systems/Stealth/NoiseEventSystem.cs`: broadcast noise events to commander HUD and hero widgets.
- `Systems/Economy/ResourceManager.cs`: replicate Evil Energy, Valor, Gold; expose events for UI.
- `Systems/Quests/QuestManager.cs`: load quest definitions, track progress, trigger objectives.
- `Systems/Units/AbilityExecutor.cs`: handles cooldowns, validation, VFX hooks for abilities.
- `Systems/Networking/PhotonBootstrap.cs`: wraps Photon Fusion connection, reconnection, room
  handling.
- `Systems/Telemetry/TelemetryClient.cs`: buffers match metrics and posts at match end.

Each system should include play mode tests in `Assets/Tests/EditMode/` verifying core behaviors (e.g.
resource replication, quest completion triggers).

## UI & UX Assets
- `UI/Prefabs/HUD/HeroHUD.prefab` and `UI/Prefabs/HUD/DarkLordHUD.prefab` with ability buttons,
  resource meters, minimap, and tutorial prompt anchors.
- `UI/Prefabs/Menus/PauseMenu.prefab`, `UI/Prefabs/Menus/MatchSummary.prefab`.
- Input System action maps: `CommanderControls.inputactions`, `HeroControls.inputactions` with mobile
  control schemes.
- `UI/Scripts/HUD/HUDController.cs`: binds resource events and quest updates.
- `UI/Scripts/Tutorial/TutorialPromptManager.cs`: sequences onboarding callouts.

## Audio Implementation Files
- Create FMOD (or Unity audio) banks for *ambient*, *combat*, *UI* layers.
- Author AudioSource prefabs for noise cues, ability triggers, gate damage.
- `Audio/Scripts/AdaptiveMusicController.cs`: swaps music states based on quest phase.
- Ensure Addressable labels for streamed audio clips.

## Build & Automation
- `ProjectSettings/Graphics` configured for URP asset; `QualitySettings` tuned for mobile defaults.
- `Editor/Build/BuildPipeline.cs`: defines CI entry point producing Android/iOS dev builds.
- GitHub Actions workflow stub referencing Unity builder action, running play mode tests and
  packaging Addressables.

## Verification Checklist
- Play mode test suite green on editor hardware.
- Three-player network session connects via Photon Fusion using local room ID.
- Match completes full quest arc with telemetry payload posted to configured endpoint.
- Android/iOS development builds deploy to reference devices without missing asset exceptions.
