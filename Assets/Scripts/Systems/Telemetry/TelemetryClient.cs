using System.Collections.Generic;
using UnityEngine;

namespace GrimmDominion.Systems.Telemetry
{
    /// <summary>
    /// Buffers match metrics for later upload.
    /// </summary>
    public class TelemetryClient : ScriptableObject
    {
        private readonly List<string> events = new();

        public void Record(string eventName)
        {
            events.Add(eventName);
        }

        public IReadOnlyList<string> Flush()
        {
            var copy = events.ToArray();
            events.Clear();
            return copy;
        }
    }
}
