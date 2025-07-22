const BaseProvider = require('../BaseProvider');
const axios = require('axios');

class JILIProvider extends BaseProvider {
  constructor(config) {
    super('JILI', config);
    this.baseURL = config.baseURL || 'https://api.jiligames.com';
    this.apiKey = config.apiKey;
    this.operatorId = config.operatorId;
  }

  async initialize() {
    try {
      const response = await axios.post(`${this.baseURL}/auth`, {
        operatorId: this.operatorId,
        apiKey: this.apiKey
      });
      
      this.authToken = response.data.token;
      this.isActive = true;
      return true;
    } catch (error) {
      console.error('JILI Provider initialization failed:', error);
      this.isActive = false;
      return false;
    }
  }

  async getGames() {
    try {
      const response = await axios.get(`${this.baseURL}/games`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      return response.data.games.map(game => ({
        id: game.gameId,
        name: game.gameName,
        provider: 'JILI',
        category: game.category,
        minBet: game.minBet,
        maxBet: game.maxBet,
        rtp: game.rtp,
        image: game.thumbnail,
        description: game.description,
        isMobile: game.isMobile,
        isDesktop: game.isDesktop
      }));
    } catch (error) {
      console.error('Error fetching JILI games:', error);
      return [];
    }
  }

  async launchGame(gameId, userData) {
    try {
      const response = await axios.post(`${this.baseURL}/launch`, {
        gameId,
        userId: userData.id,
        username: userData.username,
        currency: userData.currency || 'USD',
        language: userData.language || 'en'
      }, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      return {
        gameUrl: response.data.gameUrl,
        sessionId: response.data.sessionId,
        token: response.data.token
      };
    } catch (error) {
      console.error('Error launching JILI game:', error);
      throw new Error('Failed to launch game');
    }
  }

  async processGame(gameData) {
    try {
      const response = await axios.post(`${this.baseURL}/result`, {
        sessionId: gameData.sessionId,
        userId: gameData.userId
      }, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      return {
        winAmount: response.data.winAmount,
        multiplier: response.data.multiplier,
        isWin: response.data.winAmount > 0,
        gameData: response.data.gameData
      };
    } catch (error) {
      console.error('Error processing JILI game result:', error);
      throw new Error('Failed to process game result');
    }
  }

  async getGameDetails(gameId) {
    try {
      const response = await axios.get(`${this.baseURL}/games/${gameId}`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching JILI game details:', error);
      throw new Error('Failed to get game details');
    }
  }

  validateConfig() {
    return !!(this.config.apiKey && this.config.operatorId);
  }
}

module.exports = JILIProvider;
