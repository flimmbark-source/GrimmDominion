using System.Collections.Generic;
using UnityEngine;

namespace GrimmDominion.UI.Tutorial
{
    /// <summary>
    /// Simple sequencer for onboarding prompts.
    /// </summary>
    public class TutorialPromptManager : MonoBehaviour
    {
        [SerializeField]
        private List<string> prompts = new();

        private int currentIndex;

        public string CurrentPrompt => prompts.Count > 0 ? prompts[currentIndex] : string.Empty;

        public void Advance()
        {
            if (prompts.Count == 0)
            {
                return;
            }

            currentIndex = (currentIndex + 1) % prompts.Count;
        }
    }
}
