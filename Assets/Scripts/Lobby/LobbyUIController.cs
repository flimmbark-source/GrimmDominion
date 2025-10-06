using System;
using Photon.Fusion;
using UnityEngine;
using UnityEngine.InputSystem;

namespace GrimmDominion.Lobby
{
    /// <summary>
    /// Handles lobby UI interactions and coordinates role selection with Photon.
    /// </summary>
    public class LobbyUIController : MonoBehaviour
    {
        [SerializeField]
        private InputActionAsset inputActions;

        public event Action<int> RoleSelected;

        private NetworkRunner networkRunner;

        private void Awake()
        {
            networkRunner = new NetworkRunner();
            networkRunner.Connected += OnConnected;
        }

        private void OnEnable()
        {
            inputActions?.Enable();
        }

        private void OnDisable()
        {
            inputActions?.Disable();
        }

        public void SelectRole(int roleIndex)
        {
            RoleSelected?.Invoke(roleIndex);
        }

        public void BeginMatch()
        {
            networkRunner.StartGame();
        }

        private void OnConnected()
        {
            Debug.Log("Photon Fusion stub connected.");
        }
    }
}
