using GrimmDominion.Systems.Economy;
using GrimmDominion.Systems.Quests;
using GrimmDominion.Systems.Units;
using UnityEngine;

namespace GrimmDominion.Match
{
    /// <summary>
    /// Wires up core match managers and seeds runtime data for the slice.
    /// </summary>
    public class MatchBootstrap : MonoBehaviour
    {
        [SerializeField]
        private ResourceManager resourceManager;

        [SerializeField]
        private QuestManager questManager;

        [SerializeField]
        private AbilityExecutor abilityExecutor;

        private void Start()
        {
            resourceManager?.Initialize();
            questManager?.Initialize();
            abilityExecutor?.Initialize();
        }
    }
}
