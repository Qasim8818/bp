const providerFactory = require('./providerFactory');
const CustomProvider = require('../providers/custom/CustomProvider');
const prizePoolService = require('./prizePoolService');

class GameLobbyServiceEnhanced {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    // Initialize providers using the factory
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

    // Load providers using the factory
    await providerFactory.loadProvidersFromConfig(providerConfigs);
    
    this.initialized = true;
  }

  async getAllGames(filters = {}) {
    await this.initialize();
    
    const allGames = [];
    const activeProviders = providerFactory.getActiveProviders();

    const gamePromises = activeProviders.map(async ({ name: providerName }) => {
      try {
        const provider = providerFactory.getProvider(providerName);
        if (!provider || !provider.isActive) return [];

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
      providers: activeProviders.map(p => p.name),
      filters: {
        availableProviders: activeProviders.map(p => p.name),
        availableCategories: [...new Set(allGames.map(g => g.category))]
      }
    };
  }

  async launchGame(providerName, gameId, userData) {
    await this.initialize();
    
    const provider = providerFactory.getProvider(providerName);
    if (!provider || !provider.isActive) {
      throw new Error(`Provider ${providerName} not available`);
    }

    return await provider.launchGame(gameId, userData);
  }

  async processGame(providerName, gameData) {
    await this.initialize();
    
    const provider = providerFactory.getProvider(providerName);
    if (!provider || !provider.isActive) {
      throw new Error(`Provider ${providerName} not available`);
    }

    return await provider.processGame(gameData);
  }

  async getGameDetails(providerName, gameId) {
    await this.initialize();
    
    const provider = providerFactory.getProvider(providerName);
    if (!provider || !provider.isActive) {
      throw new Error(`Provider ${providerName} not available`);
    }

    return await provider.getGameDetails(gameId);
  }

  getProviderStatus() {
    return providerFactory.getAllProviders();
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
    const customProvider = providerFactory.getProvider('custom');
    if (customProvider && customProvider.getJackpotStats) {
      return await customProvider.getJackpotStats();
    }
    
    return null;
  }

  async getProviderHealth() {
    const providers = providerFactory.getAllProviders();
    return providers.map(({ name, status }) => ({
      name,
      isActive: status.isActive,
      gamesCount: status.gamesCount,
      configValid: status.configValid
    }));
  }
}

module.exports = new GameLobbyServiceEnhanced();
