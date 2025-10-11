using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace GrimmDominion.Systems.Performance
{
    /// <summary>
    /// Applies lightweight performance optimizations tailored for the hybrid prototype scene.
    /// </summary>
    public class HybridScenePerformanceController : MonoBehaviour
    {
        private const float DefaultSmoothingFactor = 0.1f;

        [Header("Particles")]
        [SerializeField, Range(300, 600)]
        private int particleCap = 450;

        [SerializeField]
        private bool enforceFrustumCulling = true;

        [Header("Fog")]
        [SerializeField, Range(0f, 0.1f)]
        private float fogDensity = 0.015f;

        [Header("Lighting")]
        [SerializeField, Min(0.1f)]
        private float lightingUpdateInterval = 0.5f;

        [Header("Shadows")]
        [SerializeField]
        private bool disableShadowsForSecondaryLights = true;

        [Header("Debug HUD")]
        [SerializeField]
        private KeyCode debugToggleKey = KeyCode.D;

        [SerializeField]
        private Vector2 hudPadding = new Vector2(16f, 16f);

        private struct ParticleSystemState
        {
            public ParticleSystem System;
            public int OriginalMaxParticles;
            public ParticleSystemCullingMode OriginalCullingMode;
        }

        private readonly List<ParticleSystemState> particleStates = new();
        private readonly List<(Light light, LightShadows originalShadows)> modifiedLights = new();

        private bool originalFogEnabled;
        private float originalFogDensity;
        private Coroutine lightingCoroutine;
        private bool showDebugHud;
        private float smoothedDeltaTime = -1f;

        private static HybridScenePerformanceController instance;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void Bootstrap()
        {
            SceneManager.sceneLoaded += OnSceneLoaded;
            CreateController(SceneManager.GetActiveScene());
        }

        private static void OnSceneLoaded(Scene scene, LoadSceneMode mode)
        {
            CreateController(scene);
        }

        private static void CreateController(Scene scene)
        {
            if (!scene.IsValid() || !scene.isLoaded)
            {
                return;
            }

            if (instance != null)
            {
                instance.ConfigureSceneSettings();
                return;
            }

            var gameObject = new GameObject(nameof(HybridScenePerformanceController));
            gameObject.AddComponent<HybridScenePerformanceController>();
        }

        private void Awake()
        {
            if (instance != null && instance != this)
            {
                Destroy(gameObject);
                return;
            }

            instance = this;
            DontDestroyOnLoad(gameObject);
            ConfigureSceneSettings();
        }

        private void OnEnable()
        {
            if (lightingUpdateInterval > Mathf.Epsilon && lightingCoroutine == null)
            {
                lightingCoroutine = StartCoroutine(UpdateLightingRoutine());
            }
        }

        private void OnDisable()
        {
            RestoreLightingRoutine();
            RestoreParticleSettings();
            RestoreFogSettings();
            RestoreShadowSettings();
        }

        private void Update()
        {
            if (Input.GetKeyDown(debugToggleKey))
            {
                showDebugHud = !showDebugHud;
            }

            var currentDelta = Time.unscaledDeltaTime;
            if (smoothedDeltaTime < 0f)
            {
                smoothedDeltaTime = currentDelta;
            }
            else
            {
                smoothedDeltaTime = Mathf.Lerp(smoothedDeltaTime, currentDelta, DefaultSmoothingFactor);
            }
        }

        private void OnGUI()
        {
            if (!showDebugHud)
            {
                return;
            }

            const float hudWidth = 260f;
            const float hudHeight = 140f;
            var rect = new Rect(hudPadding.x, hudPadding.y, hudWidth, hudHeight);

            GUILayout.BeginArea(rect, GUI.skin.window);
            GUILayout.Label("Performance Debug");

            var fps = smoothedDeltaTime > Mathf.Epsilon ? 1f / smoothedDeltaTime : 0f;
            GUILayout.Label($"FPS: {fps:0.} ({smoothedDeltaTime * 1000f:0.0} ms)");
            GUILayout.Label($"Particle Cap: {particleCap}");
            GUILayout.Label($"Fog Density: {RenderSettings.fogDensity:0.000}");
            GUILayout.Label($"Lighting Interval: {lightingUpdateInterval:0.00}s");
            GUILayout.Label($"Secondary Shadows Disabled: {modifiedLights.Count}");

            GUILayout.EndArea();
        }

        private void ApplyParticleOptimizations()
        {
            particleStates.Clear();
            var particleSystems = FindObjectsOfType<ParticleSystem>(true);
            foreach (var system in particleSystems)
            {
                var main = system.main;
                particleStates.Add(new ParticleSystemState
                {
                    System = system,
                    OriginalMaxParticles = main.maxParticles,
                    OriginalCullingMode = main.cullingMode
                });

                if (main.maxParticles > particleCap)
                {
                    main.maxParticles = particleCap;
                }

                if (enforceFrustumCulling)
                {
                    main.cullingMode = ParticleSystemCullingMode.Automatic;
                }
            }
        }

        private void RestoreParticleSettings()
        {
            foreach (var state in particleStates)
            {
                if (state.System == null)
                {
                    continue;
                }

                var main = state.System.main;
                main.maxParticles = state.OriginalMaxParticles;
                main.cullingMode = state.OriginalCullingMode;
            }

            particleStates.Clear();
        }

        private void ApplyFogSettings()
        {
            RenderSettings.fog = fogDensity > 0f || originalFogEnabled;
            RenderSettings.fogDensity = fogDensity;
        }

        private void RestoreFogSettings()
        {
            RenderSettings.fog = originalFogEnabled;
            RenderSettings.fogDensity = originalFogDensity;
        }

        private IEnumerator UpdateLightingRoutine()
        {
            var wait = new WaitForSeconds(lightingUpdateInterval);
            while (true)
            {
                DynamicGI.UpdateEnvironment();
                yield return wait;
            }
        }

        private void RestoreLightingRoutine()
        {
            if (lightingCoroutine != null)
            {
                StopCoroutine(lightingCoroutine);
                lightingCoroutine = null;
            }
        }

        private void ApplyShadowOptimizations()
        {
            modifiedLights.Clear();
            if (!disableShadowsForSecondaryLights)
            {
                return;
            }

            var lights = FindObjectsOfType<Light>(true);
            foreach (var light in lights)
            {
                if (light == null || light.type == LightType.Directional)
                {
                    continue;
                }

                if (light.shadows == LightShadows.None)
                {
                    continue;
                }

                modifiedLights.Add((light, light.shadows));
                light.shadows = LightShadows.None;
            }
        }

        private void RestoreShadowSettings()
        {
            foreach (var (light, originalShadows) in modifiedLights)
            {
                if (light == null)
                {
                    continue;
                }

                light.shadows = originalShadows;
            }

            modifiedLights.Clear();
        }

        private void ConfigureSceneSettings()
        {
            originalFogEnabled = RenderSettings.fog;
            originalFogDensity = RenderSettings.fogDensity;

            ApplyParticleOptimizations();
            ApplyFogSettings();
            ApplyShadowOptimizations();
        }

        private void OnDestroy()
        {
            if (instance == this)
            {
                instance = null;
            }

            SceneManager.sceneLoaded -= OnSceneLoaded;
        }
    }
}
