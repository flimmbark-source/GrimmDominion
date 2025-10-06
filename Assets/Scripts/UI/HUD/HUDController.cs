using GrimmDominion.Systems.Economy;
using GrimmDominion.Systems.Quests;
using UnityEngine;

namespace GrimmDominion.UI.HUD
{
    /// <summary>
    /// Binds resource and quest events to the HUD widgets.
    /// </summary>
    public class HUDController : MonoBehaviour
    {
        [SerializeField]
        private ResourceManager resourceManager;

        [SerializeField]
        private QuestManager questManager;

        private void OnEnable()
        {
            if (resourceManager != null)
            {
                resourceManager.EvilEnergyChanged += OnEvilEnergyChanged;
                resourceManager.ValorChanged += OnValorChanged;
                resourceManager.GoldChanged += OnGoldChanged;
            }
        }

        private void OnDisable()
        {
            if (resourceManager != null)
            {
                resourceManager.EvilEnergyChanged -= OnEvilEnergyChanged;
                resourceManager.ValorChanged -= OnValorChanged;
                resourceManager.GoldChanged -= OnGoldChanged;
            }
        }

        private void OnEvilEnergyChanged(int value) => Debug.Log($"Evil Energy: {value}");
        private void OnValorChanged(int value) => Debug.Log($"Valor: {value}");
        private void OnGoldChanged(int value) => Debug.Log($"Gold: {value}");
    }
}
