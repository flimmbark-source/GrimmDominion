using UnityEngine;

namespace GrimmDominion.Audio
{
    /// <summary>
    /// Swaps music states based on quest phase callbacks.
    /// </summary>
    public class AdaptiveMusicController : MonoBehaviour
    {
        [SerializeField]
        private AudioSource audioSource;

        public void PlayState(AudioClip clip)
        {
            if (audioSource == null || clip == null)
            {
                return;
            }

            audioSource.clip = clip;
            audioSource.Play();
        }
    }
}
