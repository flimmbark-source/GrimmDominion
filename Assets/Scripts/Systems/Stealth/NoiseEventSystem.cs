using System;
using System.Collections.Generic;
using UnityEngine;

namespace GrimmDominion.Systems.Stealth
{
    /// <summary>
    /// Broadcasts noise events to listeners such as the commander HUD.
    /// </summary>
    public class NoiseEventSystem : MonoBehaviour
    {
        private readonly List<Action<Vector3, float>> listeners = new();

        public void Register(Action<Vector3, float> listener)
        {
            if (!listeners.Contains(listener))
            {
                listeners.Add(listener);
            }
        }

        public void Unregister(Action<Vector3, float> listener)
        {
            listeners.Remove(listener);
        }

        public void Emit(Vector3 position, float intensity)
        {
            foreach (var listener in listeners)
            {
                listener(position, intensity);
            }
        }
    }
}
