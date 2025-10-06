using UnityEngine;

namespace GrimmDominion.Systems.FogOfWar
{
    /// <summary>
    /// Tracks visibility states for commander and hero roles.
    /// </summary>
    public class FogService : ScriptableObject
    {
        [SerializeField]
        private Texture2D visibilityMask;

        public Texture2D VisibilityMask => visibilityMask;
    }
}
