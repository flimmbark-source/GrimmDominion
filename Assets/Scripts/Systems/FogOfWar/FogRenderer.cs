using UnityEngine;

namespace GrimmDominion.Systems.FogOfWar
{
    /// <summary>
    /// Applies the fog service texture to the world via a simple quad.
    /// </summary>
    [ExecuteAlways]
    public class FogRenderer : MonoBehaviour
    {
        [SerializeField]
        private FogService fogService;

        [SerializeField]
        private Renderer targetRenderer;

        private static readonly int MaskProperty = Shader.PropertyToID("_MaskTex");

        private void LateUpdate()
        {
            if (fogService == null || targetRenderer == null)
            {
                return;
            }

            targetRenderer.sharedMaterial.SetTexture(MaskProperty, fogService.VisibilityMask);
        }
    }
}
