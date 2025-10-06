using GrimmDominion.Systems.Economy;
using NUnit.Framework;
using UnityEngine;

namespace GrimmDominion.Tests.EditMode
{
    public class ResourceManagerTests
    {
        [Test]
        public void ModifyResourcesPublishesEvents()
        {
            var manager = ScriptableObject.CreateInstance<ResourceManager>();
            var lastValue = -1;
            manager.EvilEnergyChanged += value => lastValue = value;

            manager.ModifyEvilEnergy(5);

            Assert.AreEqual(5, lastValue);
        }
    }
}
