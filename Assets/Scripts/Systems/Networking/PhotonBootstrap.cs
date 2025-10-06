using Photon.Fusion;
using UnityEngine;

namespace GrimmDominion.Systems.Networking
{
    /// <summary>
    /// Provides a single entry point for connecting to Photon Fusion sessions.
    /// </summary>
    public class PhotonBootstrap : MonoBehaviour
    {
        private NetworkRunner runner;

        private void Awake()
        {
            runner = new NetworkRunner();
            runner.Connected += () => Debug.Log("Photon Fusion stub connected");
        }

        public void Connect()
        {
            runner.StartGame();
        }
    }
}
