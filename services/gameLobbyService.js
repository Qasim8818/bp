const JILIProvider = require('../providers/external/JILIProvider');
const PragmaticProvider = require('../providers/external/PragmaticProvider');
const EvolutionProvider = require('../providers/external/EvolutionProvider');
const CustomProvider = require('../providers/custom/CustomProvider');

class GameLobbyService {
  constructor() {
    this.providers = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    // Initialize all providers
    const providerConfigs = {
      jili: {
        apiKey: process.env.JILI_API_KEY,
        operatorId: process.env.JILI_OPERATOR_ID,
        baseURL: process.env.JILI_BASE_URL
      },
      pragmatic: {
        apiKey: process.env.PRAGMATIC_API_KEY,
        operatorId: process.env.PRAGMATIC_OPERATOR_ID,
        secretKey: process.env.PRAGMATIC_SECRET_KEY,
        baseURL: process.env.PRAGMATIC_BASE_URL
      },
      evolution: {
        casinoKey: process.env.EVOLUTION_CASINO_KEY,
        apiKey: process.env.EVOLUTION_API_KEY,
        operatorId: process.env.EVOLUTION_OPERATOR_ID,
        baseURL: process.env.EVOLUTION_BASE_URL
      },
      custom: {
        // Custom provider doesn't need external config
      }
    };

    // Initialize providers
    this.providers.set('jili', new JILIProvider(providerConfigs.jili));
    this.providers.set('pragmatic', new PragmaticProvider(providerConfigs.pragmatic));
    this.providers.set('evolution', new EvolutionProvider(providerConfigs.evolution));
    this.providers.set('custom', new CustomProvider(providerConfigs.custom));

    // Initialize all providers
    const initPromises = Array.from(this.providers.entries()).map(async ([name, provider]) => {
      try {
        const success = await provider.initialize();
        console.log(`Provider ${name} initialized: ${success}`);
        return { name, success };
      } catch (error) {
        console.error(`Failed to initialize provider ${name}:`, error);
        return { name, success: false, error: error.message };
      }
    });

    await Promise.all(initPromises);
    this.initialized = true;
  }

  async getAllGames(filters = {}) {
    await this.initialize();
    
    const allGames = [];
    const activeProviders = Array.from(this.providers.entries())
      .filter(([_, provider]) => provider.isActive);

    const gamePromises = activeProviders.map(async ([providerName, provider]) => {
      try {
        const games = await provider.getGames();
        return games.map(game => ({
          ...game,
          provider: providerName,
          providerStatus: provider.getStatus()
        }));
      } catch (error) {
        console.error(`Error fetching games from ${providerName}:`, error);
        return [];
      }
    });

    const providerGames = await Promise.all(gamePromises);
    allGames.push(...providerGames.flat());

    // Apply filters
    let filteredGames = allGames;

    if (filters.provider && filters.provider !== 'all') {
      filteredGames = filteredGames.filter(game => 
        game.provider.toLowerCase() === filters.provider.toLowerCase()
      );
    }

    if (filters.category && filters.category !== 'all') {
      filteredGames = filteredGames.filter(game => 
        game.category.toLowerCase() === filters.category.toLowerCase()
      );
    }

    if (filters.minBet) {
      filteredGames = filteredGames.filter(game => 
        game.minBet >= filters.minBet
      );
    }

    if (filters.maxBet) {
      filteredGames = filteredGames.filter(game => 
        game.maxBet <= filters.maxBet
      );
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredGames = filteredGames.filter(game => 
        game.name.toLowerCase().includes(searchTerm) ||
        game.description.toLowerCase().includes(searchTerm)
      );
    }

    // Sort games
    const sortBy = filters.sortBy || 'name';
    const sortOrder = filters.sortOrder || 'asc';
    
    filteredGames.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (sortOrder === 'desc') {
        return bVal > aVal ? 1 : -1;
      }
      return aVal > bVal ? 1 : -1;
    });

    return {
      games: filteredGames,
      totalCount: filteredGames.length,
      providers: Array.from(this.providers.keys()),
      filters: {
        availableProviders: Array.from(this.providers.keys()),
        availableCategories: [...new Set(allGames.map(g => g.category))]
      }
    };
  }

  async launchGame(providerName, gameId, userData) {
    await this.initialize();
    
    const provider = this.providers.get(providerName);
    if (!provider || !provider.isActive) {
      throw new Error(`Provider ${providerName} not available`);
    }

    return await provider.launchGame(gameId, userData);
  }

  async processGame(providerName, gameData) {
    await this.initialize();
    
    const provider = this.providers.get(providerName);
    if (!provider || !provider.isActive) {
      throw new Error(`Provider ${providerName} not available`);
    }

    return await provider.processGame(gameData);
  }

  async getGameDetails(providerName, gameId) {
    await this.initialize();
    
    const provider = this.providers.get(providerName);
    if (!provider || !provider.isActive) {
      throw new Error(`Provider ${providerName} not available`);
    }

    return await provider.getGameDetails(gameId);
  }

  getProviderStatus() {
    const status = {};
    for (const [name, provider] of this.providers) {
      status[name] = provider.getStatus();
    }
    return status;
  }

  async getFeaturedGames() {
    const allGames = await this.getAllGames();
    
    // Get top games from each provider
    const featured = [];
    
    // Add jackpot games
    const jackpotGames = allGames.games.filter(g => g.hasJackpot);
    featured.push(...jackpotGames.slice(0, 3));
    
    // Add popular games (highest max bet)
    const popularGames = [...allGames.games]
      .sort((a, b) => b.maxBet - a.maxBet)
      .slice(0, 3);
    
    featured.push(...popularGames);
    
    // Add new games (custom provider games)
    const newGames = allGames.games.filter(g => g.provider === 'custom');
    featured.push(...newGames.slice(0, 3));
    
    // Remove duplicates
    const uniqueFeatured = featured.filter((game, index, self) => 
      index === self.findIndex(g => g.id === game.id && g.provider === game.provider)
    );

    return uniqueFeatured.slice(0, 9);
  }

  async getJackpotStats() {
    const customProvider = this.providers.get('custom');
    if (customProvider && customProvider.getJackpotStats) {
      return await customProvider.getJackpotStats();
    }
    
    return null;
  }
}

module.exports = new GameLobbyService();
