using GrimmDominion.Scripts.Data;
using UnityEngine;

namespace GrimmDominion.Systems.Units
{
    /// <summary>
    /// Executes abilities defined via scriptable objects.
    /// </summary>
    public class AbilityExecutor : MonoBehaviour
    {
        [SerializeField]
        private AbilityDefinition defaultAbility;

        public void Initialize()
        {
            if (defaultAbility != null)
            {
                Debug.Log($"Ability ready: {defaultAbility.displayName}");
            }
        }
    }
}
