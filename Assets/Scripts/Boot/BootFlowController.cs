using System.Collections;
using UnityEngine;

namespace GrimmDominion.Boot
{
    /// <summary>
    /// Coordinates initial service bring-up before transitioning into the lobby scene.
    /// </summary>
    public class BootFlowController : MonoBehaviour
    {
        [SerializeField]
        private string lobbySceneName = "Lobby";

        private IEnumerator Start()
        {
            yield return InitializeServices();
            UnityEngine.SceneManagement.SceneManager.LoadScene(lobbySceneName);
        }

        private IEnumerator InitializeServices()
        {
            // TODO: Replace with addressables, telemetry, and netcode initialization.
            yield return null;
        }
    }
}
