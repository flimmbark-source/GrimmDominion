using UnityEngine;

namespace GrimmDominion.Scripts.Data
{
    [CreateAssetMenu(menuName = "Grimm Dominion/Data/Unit")]
    public class UnitDefinition : ScriptableObject
    {
        public string unitName;
        public int health;
        public float moveSpeed;
        public float navAgentRadius;
        public AbilityDefinition[] abilities;
    }
}
