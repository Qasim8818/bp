const BaseProvider = require('../BaseProvider');
const axios = require('axios');

class EvolutionProvider extends BaseProvider {
  constructor(config) {
    super('Evolution', config);
    this.baseURL = config.baseURL || 'https://api.evolutiongaming.com';
    this.casinoKey = config.casinoKey;
    this.apiKey = config.apiKey;
    this.operatorId = config.operatorId;
  }

  async initialize() {
    try {
      const response = await axios.post(`${this.baseURL}/auth`, {
        casinoKey: this.casinoKey,
        apiKey: this.apiKey
      });
      
      this.authToken = response.data.token;
      this.isActive = true;
      return true;
    } catch (error) {
      console.error('Evolution Provider initialization failed:', error);
      this.isActive = false;
      return false;
    }
  }

  async getGames() {
    try {
      const response = await axios.get(`${this.baseURL}/lobby/games`, {
        headers: { 
          'Authorization': `Bearer ${this.authToken}`,
          'X-Casino-Key': this.casinoKey
        }
      });
      
      return response.data.games.map(game => ({
        id: game.gameId,
        name: game.gameName,
        provider: 'Evolution',
        category: game.category,
        type: game.type,
        tableId: game.tableId,
        dealer: game.dealer,
        minBet: game.minBet,
        maxBet: game.maxBet,
        currency: game.currency,
        status: game.status,
        players: game.players,
        image: game.thumbnail,
        description: game.description,
        isLive: game.isLive,
        streamUrl: game.streamUrl
      }));
    } catch (error) {
      console.error('Error fetching Evolution games:', error);
      return [];
    }
  }

  async launchGame(gameId, userData) {
    try {
      const response = await axios.post(`${this.baseURL}/game/launch`, {
        gameId,
        userId: userData.id,
        username: userData.username,
        currency: userData.currency || 'USD',
        language: userData.language || 'en',
        country: userData.country || 'US',
        clientType: 'web'
      }, {
        headers: { 
          'Authorization': `Bearer ${this.authToken}`,
          'X-Casino-Key': this.casinoKey
        }
      });

      return {
        gameUrl: response.data.entryUrl,
        sessionId: response.data.sessionId,
        token: response.data.token,
        tableId: response.data.tableId,
        dealer: response.data.dealer
      };
    } catch (error) {
      console.error('Error launching Evolution game:', error);
      throw new Error('Failed to launch game');
    }
  }

  async processGame(gameData) {
    try {
      const response = await axios.post(`${this.baseURL}/game/result`, {
        sessionId: gameData.sessionId,
        userId: gameData.userId
      }, {
        headers: { 
          'Authorization': `Bearer ${this.authToken}`,
          'X-Casino-Key': this.casinoKey
        }
      });

      return {
        winAmount: response.data.winAmount,
        multiplier: response.data.multiplier,
        isWin: response.data.winAmount > 0,
        gameData: response.data.gameData,
        roundId: response.data.roundId,
        timestamp: response.data.timestamp
      };
    } catch (error) {
      console.error('Error processing Evolution game result:', error);
      throw new Error('Failed to process game result');
    }
  }

  async getGameDetails(gameId) {
    try {
      const response = await axios.get(`${this.baseURL}/games/${gameId}`, {
        headers: { 
          'Authorization': `Bearer ${this.authToken}`,
          'X-Casino-Key': this.casinoKey
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching Evolution game details:', error);
      throw new Error('Failed to get game details');
    }
  }

  async getLiveTables() {
    try {
      const response = await axios.get(`${this.baseURL}/lobby/tables`, {
        headers: { 
          'Authorization': `Bearer ${this.authToken}`,
          'X-Casino-Key': this.casinoKey
        }
      });

      return response.data.tables;
    } catch (error) {
      console.error('Error fetching Evolution live tables:', error);
      return [];
    }
  }

  validateConfig() {
    return !!(this.config.casinoKey && this.config.apiKey);
  }
}

module.exports = EvolutionProvider;
