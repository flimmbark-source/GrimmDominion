using UnityEngine;

namespace GrimmDominion.BehaviorTree
{
    /// <summary>
    /// Temporary placeholder component so scenes can reference a behavior tree asset
    /// without the actual middleware present. Replace with integration when available.
    /// </summary>
    public class BehaviorTreePlaceholder : MonoBehaviour
    {
        [Tooltip("Name of the behavior graph this agent should execute.")]
        public string behaviorId = "Default";
    }
}
