# Project Bootstrapping Plan

## Overview
This guide translates the Grimm Dominion vertical slice requirements into a concrete Unity project
setup checklist. Follow the steps sequentially when configuring the production repository so the
team shares identical project settings, package baselines, and asset scaffolding.

## 1. Unity Project Creation
1. Launch **Unity Hub 3.x** and install **Unity 2022.3 LTS** with the **Universal Render Pipeline**
   feature set plus Android/iOS build support.
2. Create a new project using the **URP (Universal Render Pipeline)** template.
3. Name the project `GrimmDominion` and set the location to the repository root.
4. Allow the editor to generate default URP content, then close Unity before making manual edits in
   the file system.

## 2. Source Control Configuration
1. Reopen the project in Unity.
2. Navigate to **Edit ▸ Project Settings ▸ Editor** and set:
   - **Version Control** mode to `Visible Meta Files`.
   - **Asset Serialization** mode to `Force Text`.
3. Save the project to ensure `.meta` files are written.
4. From a terminal at the repository root, enable Git LFS for binary-heavy directories:
   ```bash
   git lfs install
   git lfs track "Assets/Art/**"
   git lfs track "Assets/Audio/**"
   git lfs track "Assets/AddressableAssets/**"
   git add .gitattributes
   ```
5. Commit the baseline settings change before importing packages to simplify diff review.

## 3. Package Manager Installation
Use Unity's **Window ▸ Package Manager** (Unity Registry source) to install the following packages:
- **Universal RP** (should already exist via template; verify version matches 2022.3 stream).
- **Input System** – enable the *Use the new Input System* backend when prompted.
- **Cinemachine**.
- **Addressables** – create default groups.
- **Photon Fusion SDK** – add scoped registry per Photon instructions if not bundled.
- **Behavior Tree Tooling** – either import Behavior Designer (Asset Store) or add internal package
  once available.

> **Tip:** After each install, select **Project Settings ▸ Player** and confirm any required defines
(e.g., `FUSION_WEAVER`). Document new scripting define symbols in `docs/prototype/technology.md`.

## 4. Folder Structure
Create the following top-level folders under `Assets/` (Unity automatically generates `.meta`
files):
```
Assets/
  AddressableAssets/
    Art/
    Audio/
    NetCode/
    Prefabs/
    Scenes/
    ScriptableObjects/
    UI/
  Art/
  Audio/
  Editor/
  NetCode/
  Prefabs/
  Scenes/
  Scripts/
    Boot/
    Lobby/
    Match/
    Systems/
      Economy/
      FogOfWar/
      Networking/
      Quests/
      Stealth/
      Telemetry/
      Units/
  ScriptableObjects/
    Abilities/
    ChunkLayouts/
    Quests/
    Resources/
    Units/
  Tests/
    EditMode/
  UI/
    Prefabs/
      HUD/
      Menus/
  Audio/
    Scripts/
```
> **Note:** Mirror any additional runtime folders inside `Assets/AddressableAssets/` if they contain
content streamed at runtime (e.g., `Assets/AddressableAssets/Prefabs/Heroes`).

## 5. Scene & Game Flow Assets
1. Create scenes:
   - `Assets/Scenes/Boot.unity`
   - `Assets/Scenes/Lobby.unity`
   - `Assets/Scenes/CastlePlateau_VSlice.unity`
2. Author scene scripts:
   - `Assets/Scripts/Boot/BootFlowController.cs`
   - `Assets/Scripts/Lobby/LobbyUIController.cs`
   - `Assets/Scripts/Match/MatchBootstrap.cs`
3. Configure Addressables groups so each scene is addressable for async loading.
4. Set **Boot.unity** as the first scene in **File ▸ Build Settings**.

## 6. Scriptable Object Definitions
Create data definitions under `Assets/Scripts/Data/` with public fields aligning to gameplay
documentation. Example structure:
- `AbilityDefinition.cs`
- `UnitDefinition.cs`
- `QuestDefinition.cs`
- `ResourceCurve.cs`
- `ChunkLayoutDefinition.cs`

Store initial instances under the matching `Assets/ScriptableObjects/` subfolders (e.g.,
`Assets/ScriptableObjects/Abilities/DefaultStrike.asset`). Reference these assets from role and quest
controllers to avoid hard-coded values.

## 7. Prefab Assembly
1. Build hero prefabs in `Assets/Prefabs/Heroes/` for **ExiledKnight** and **GoblinOutlaw** with
   character controller, ability executor, animation placeholders, and Photon network object.
2. Author Dark Lord commander rig under `Assets/Prefabs/DarkLord/CommanderRig.prefab` including
   Cinemachine virtual cameras and UI anchors.
3. Populate minion prefabs (skeleton, imp, bonecrusher) with NavMeshAgent, health component, and
   behavior tree hooks.
4. Place interactive props (gate, shrine, villager cages, gold caches, tavern, ritual node) in
   `Assets/Prefabs/Props/` and label with Addressables for streaming.
5. Produce biome chunk blockouts under `Assets/Prefabs/Biomes/` with spawn marker child transforms.

## 8. Systems & Gameplay Scripts
Author the following systems under `Assets/Scripts/Systems/` with namespaces matching their folders:
- `FogOfWar/FogService.cs` & `FogOfWar/FogRenderer.cs`
- `Stealth/NoiseEventSystem.cs`
- `Economy/ResourceManager.cs`
- `Quests/QuestManager.cs`
- `Units/AbilityExecutor.cs`
- `Networking/PhotonBootstrap.cs`
- `Telemetry/TelemetryClient.cs`

For each system, add play mode tests in `Assets/Tests/EditMode/` validating critical behaviors
(e.g., resource replication, quest completion events, telemetry batching).

## 9. UI & UX Assets
1. Create Addressable UI prefabs:
   - `UI/Prefabs/HUD/HeroHUD.prefab`
   - `UI/Prefabs/HUD/DarkLordHUD.prefab`
   - `UI/Prefabs/Menus/PauseMenu.prefab`
   - `UI/Prefabs/Menus/MatchSummary.prefab`
2. Implement Input System action maps:
   - `Assets/UI/Input/CommanderControls.inputactions`
   - `Assets/UI/Input/HeroControls.inputactions`
3. Add scripts:
   - `UI/Scripts/HUD/HUDController.cs`
   - `UI/Scripts/Tutorial/TutorialPromptManager.cs`
4. Ensure HUD prefabs subscribe to `ResourceManager` and `QuestManager` events for updates.

## 10. Audio Implementation
1. Author FMOD or Unity audio banks covering ambient, combat, and UI layers; store under
   `Assets/Audio/Banks/`.
2. Create AudioSource prefabs for noise cues and ability triggers, tagging them with Addressable
   labels.
3. Implement `Audio/Scripts/AdaptiveMusicController.cs` to switch music states based on quest phase.

## 11. Build & Automation
1. Configure `ProjectSettings/Graphics` to reference the URP asset created by the template.
2. Tune `ProjectSettings/QualitySettings` for mobile defaults (texture quality, shadows).
3. Implement `Assets/Editor/Build/BuildPipeline.cs` with CI entry points for Android and iOS.
4. Add a GitHub Actions workflow under `.github/workflows/unity-ci.yml` referencing the Unity builder
   action to run edit mode tests, build Addressables, and produce platform builds.

## 12. Verification Checklist
Run the following before merging feature work:
- ✅ Play mode test suite passes on the reference editor hardware.
- ✅ Photon Fusion connects three local clients to the same room.
- ✅ Match completes full quest arc and posts telemetry payload.
- ✅ Android and iOS development builds deploy without missing asset exceptions.

Document deviations or blockers in `docs/prototype/roadmap.md` to keep stakeholders informed.
