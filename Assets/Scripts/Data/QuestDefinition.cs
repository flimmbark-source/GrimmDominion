using UnityEngine;

namespace GrimmDominion.Scripts.Data
{
    [CreateAssetMenu(menuName = "Grimm Dominion/Data/Quest")]
    public class QuestDefinition : ScriptableObject
    {
        public string questName;
        [TextArea]
        public string description;
        public string[] steps;
    }
}
