using UnityEngine;

namespace GrimmDominion.Scripts.Data
{
    [CreateAssetMenu(menuName = "Grimm Dominion/Data/Chunk Layout")]
    public class ChunkLayoutDefinition : ScriptableObject
    {
        public string biomeName;
        public GameObject[] chunkPrefabs;
    }
}
