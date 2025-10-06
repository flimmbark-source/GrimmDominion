using UnityEngine;

namespace GrimmDominion.Scripts.Data
{
    [CreateAssetMenu(menuName = "Grimm Dominion/Data/Ability")]
    public class AbilityDefinition : ScriptableObject
    {
        public string displayName;
        public int energyCost;
        public float cooldown;
        public GameObject visualEffect;
    }
}
