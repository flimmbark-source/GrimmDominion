using System.Collections.Generic;
using GrimmDominion.Scripts.Data;
using UnityEngine;

namespace GrimmDominion.Systems.Quests
{
    /// <summary>
    /// Loads quest definitions and tracks their completion state.
    /// </summary>
    public class QuestManager : MonoBehaviour
    {
        [SerializeField]
        private List<QuestDefinition> quests = new();

        public void Initialize()
        {
            foreach (var quest in quests)
            {
                Debug.Log($"Quest loaded: {quest.questName}");
            }
        }
    }
}
