const JILIProvider = require('../providers/external/JILIProvider');
const PragmaticProvider = require('../providers/external/PragmaticProvider');
const EvolutionProvider = require('../providers/external/EvolutionProvider');
const CustomProvider = require('../providers/custom/CustomProvider');

class EnhancedProviderFactory {
  constructor() {
    this.providers = new Map();
    this.providerConfigs = new Map();
    this.initialized = false;
  }

  async initializeProviders() {
    if (this.initialized) return;

    // Load configurations from environment or config file
    const configs = {
      JILI: {
        apiKey: process.env.JILI_API_KEY,
        operatorId: process.env.JILI_OPERATOR_ID,
        baseURL: process.env.JILI_BASE_URL || 'https://api.jiligames.com',
        enabled: process.env.JILI_ENABLED === 'true'
      },
      Pragmatic: {
        apiKey: process.env.PRAGMATIC_API_KEY,
        operatorId: process.env.PRAGMATIC_OPERATOR_ID,
        baseURL: process.env.PRAGMATIC_BASE_URL || 'https://api.pragmaticplay.com',
        enabled: process.env.PRAGMATIC_ENABLED === 'true'
      },
      Evolution: {
        apiKey: process.env.EVOLUTION_API_KEY,
        operatorId: process.env.EVOLUTION_OPERATOR_ID,
        baseURL: process.env.EVOLUTION_BASE_URL || 'https://api.evolution.com',
        enabled: process.env.EVOLUTION_ENABLED === 'true'
      },
      Custom: {
        enabled: process.env.CUSTOM_PROVIDER_ENABLED !== 'false',
        jackpotEnabled: process.env.JACKPOT_ENABLED !== 'false',
        minJackpot: parseFloat(process.env.MIN_JACKPOT || '1000'),
        maxJackpot: parseFloat(process.env.MAX_JACKPOT || '100000')
      }
    };

    // Initialize providers
    for (const [name, config] of Object.entries(configs)) {
      if (config.enabled) {
        let provider;
        
        switch (name) {
          case 'JILI':
            provider = new JILIProvider(config);
            break;
          case 'Pragmatic':
            provider = new PragmaticProvider(config);
            break;
          case 'Evolution':
            provider = new EvolutionProvider(config);
            break;
          case 'Custom':
            provider = new CustomProvider(config);
            break;
        }

        if (provider) {
          try {
            const initialized = await provider.initialize();
            if (initialized) {
              this.providers.set(name, provider);
              this.providerConfigs.set(name, config);
              console.log(`${name} provider initialized successfully`);
            } else {
              console.warn(`${name} provider initialization failed`);
            }
          } catch (error) {
            console.error(`Error initializing ${name} provider:`, error);
          }
        }
      }
    }

    this.initialized = true;
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
        provider
      }));
  }

  async getAllGames() {
    const allGames = [];
    
    for (const [providerName, provider] of this.providers) {
      try {
        const games = await provider.getGames();
        allGames.push(...games.map(game => ({
          ...game,
          provider: providerName
        })));
      } catch (error) {
        console.error(`Error fetching games from ${providerName}:`, error);
      }
    }
    
    return allGames;
  }

  async launchGame(providerName, gameId, userData) {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }
    
    return await provider.launchGame(gameId, userData);
  }

  async processGame(providerName, gameData) {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }
    
    return await provider.processGame(gameData);
  }

  async getGameDetails(providerName, gameId) {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }
    
    return await provider.getGameDetails(gameId);
  }

  getProviderStats() {
    const stats = {};
    
    for (const [name, provider] of this.providers) {
      stats[name] = provider.getStatus();
    }
    
    return stats;
  }

  async refreshProviders() {
    console.log('Refreshing provider configurations...');
    this.initialized = false;
    this.providers.clear();
    this.providerConfigs.clear();
    await this.initializeProviders();
  }
}

module.exports = new EnhancedProviderFactory();
