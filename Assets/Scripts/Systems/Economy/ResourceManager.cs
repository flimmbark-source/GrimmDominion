using System;
using UnityEngine;

namespace GrimmDominion.Systems.Economy
{
    /// <summary>
    /// Tracks shared resource pools and exposes events when values change.
    /// </summary>
    [CreateAssetMenu(menuName = "Grimm Dominion/Systems/Resource Manager")]
    public class ResourceManager : ScriptableObject
    {
        public event Action<int> EvilEnergyChanged;
        public event Action<int> ValorChanged;
        public event Action<int> GoldChanged;

        [SerializeField]
        private int evilEnergy;

        [SerializeField]
        private int valor;

        [SerializeField]
        private int gold;

        public void Initialize()
        {
            Publish();
        }

        public void ModifyEvilEnergy(int delta)
        {
            evilEnergy += delta;
            EvilEnergyChanged?.Invoke(evilEnergy);
        }

        public void ModifyValor(int delta)
        {
            valor += delta;
            ValorChanged?.Invoke(valor);
        }

        public void ModifyGold(int delta)
        {
            gold += delta;
            GoldChanged?.Invoke(gold);
        }

        private void Publish()
        {
            EvilEnergyChanged?.Invoke(evilEnergy);
            ValorChanged?.Invoke(valor);
            GoldChanged?.Invoke(gold);
        }
    }
}
