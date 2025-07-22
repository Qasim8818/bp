const fs = require('fs');
const path = require('path');

class ProviderFactory {
  constructor() {
    this.providers = new Map();
    this.providerConfigs = new Map();
  }

  async registerProvider(name, providerClass, config) {
    try {
      const Provider = require(providerClass);
      const instance = new Provider(config);
      
      const success = await instance.initialize();
      if (success) {
        this.providers.set(name, instance);
        this.providerConfigs.set(name, config);
        console.log(`Provider ${name} registered successfully`);
        return true;
      }
      
      console.error(`Failed to initialize provider ${name}`);
      return false;
    } catch (error) {
      console.error(`Error registering provider ${name}:`, error);
      return false;
    }
  }

  async unregisterProvider(name) {
    if (this.providers.has(name)) {
      this.providers.delete(name);
      this.providerConfigs.delete(name);
      console.log(`Provider ${name} unregistered`);
      return true;
    }
    return false;
  }

  getProvider(name) {
    return this.providers.get(name);
  }

  getAllProviders() {
    return Array.from(this.providers.entries()).map(([name, provider]) => ({
      name,
      status: provider.getStatus()
    }));
  }

  getActiveProviders() {
    return Array.from(this.providers.entries())
      .filter(([_, provider]) => provider.isActive)
      .map(([name, provider]) => ({
        name,
        status: provider.getStatus()
      }));
  }

  async reloadProvider(name) {
    if (this.providers.has(name)) {
      const config = this.providerConfigs.get(name);
      await this.unregisterProvider(name);
      
      // Determine provider class path based on name
      let providerPath;
      if (name === 'custom') {
        providerPath = '../providers/custom/CustomProvider';
      } else {
        providerPath = `../providers/external/${name.charAt(0).toUpperCase() + name.slice(1)}Provider`;
      }
      
      return await this.registerProvider(name, providerPath, config);
    }
    return false;
  }

  async loadProvidersFromConfig(config) {
    const results = [];
    
    for (const [providerName, providerConfig] of Object.entries(config)) {
      let providerPath;
      
      if (providerName === 'custom') {
        providerPath = '../providers/custom/CustomProvider';
      } else {
        providerPath = `../providers/external/${providerName.charAt(0).toUpperCase() + providerName.slice(1)}Provider`;
      }
      
      const success = await this.registerProvider(providerName, providerPath, providerConfig);
      results.push({ name: providerName, success });
    }
    
    return results;
  }
}

module.exports = new ProviderFactory();
