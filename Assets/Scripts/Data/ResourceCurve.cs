using UnityEngine;

namespace GrimmDominion.Scripts.Data
{
    [CreateAssetMenu(menuName = "Grimm Dominion/Data/Resource Curve")]
    public class ResourceCurve : ScriptableObject
    {
        public AnimationCurve income;
        public AnimationCurve expense;
    }
}
