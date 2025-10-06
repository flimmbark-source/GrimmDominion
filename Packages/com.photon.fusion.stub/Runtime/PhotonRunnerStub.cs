using System;

namespace Photon.Fusion
{
    /// <summary>
    /// Minimal stand-in for the Photon Fusion runner so gameplay scripts can compile
    /// until the real SDK is imported locally.
    /// </summary>
    public class NetworkRunner
    {
        public event Action Connected;

        public void StartGame()
        {
            Connected?.Invoke();
        }
    }
}
