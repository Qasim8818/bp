const BaseProvider = require('../BaseProvider');
const axios = require('axios');
const crypto = require('crypto');

class PragmaticProvider extends BaseProvider {
  constructor(config) {
    super('PragmaticPlay', config);
    this.baseURL = config.baseURL || 'https://api.pragmaticplay.com';
    this.apiKey = config.apiKey;
    this.operatorId = config.operatorId;
    this.secretKey = config.secretKey;
  }

  generateSignature(params) {
    const sortedParams = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&');
    return crypto.createHmac('sha256', this.secretKey).update(sortedParams).digest('hex');
  }

  async initialize() {
    try {
      const params = {
        operatorId: this.operatorId,
        timestamp: Date.now()
      };
      
      params.signature = this.generateSignature(params);
      
      const response = await axios.post(`${this.baseURL}/auth`, params);
      
      this.authToken = response.data.token;
      this.isActive = true;
      return true;
    } catch (error) {
      console.error('Pragmatic Provider initialization failed:', error);
      this.isActive = false;
      return false;
    }
  }

  async getGames() {
    try {
      const params = {
        operatorId: this.operatorId,
        timestamp: Date.now()
      };
      
      params.signature = this.generateSignature(params);
      
      const response = await axios.get(`${this.baseURL}/games`, {
        params,
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      return response.data.games.map(game => ({
        id: game.gameId,
        name: game.gameName,
        provider: 'PragmaticPlay',
        category: game.category,
        minBet: game.minBet,
        maxBet: game.maxBet,
        rtp: game.rtp,
        image: game.thumbnail,
        description: game.description,
        features: game.features || [],
        volatility: game.volatility
      }));
    } catch (error) {
      console.error('Error fetching Pragmatic games:', error);
      return [];
    }
  }

  async launchGame(gameId, userData) {
    try {
      const params = {
        gameId,
        userId: userData.id,
        username: userData.username,
        currency: userData.currency || 'USD',
        timestamp: Date.now()
      };
      
      params.signature = this.generateSignature(params);
      
      const response = await axios.post(`${this.baseURL}/launch`, params, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      return {
        gameUrl: response.data.gameUrl,
        sessionId: response.data.sessionId,
        token: response.data.token,
        expiresAt: response.data.expiresAt
      };
    } catch (error) {
      console.error('Error launching Pragmatic game:', error);
      throw new Error('Failed to launch game');
    }
  }

  async processGame(gameData) {
    try {
      const params = {
        sessionId: gameData.sessionId,
        userId: gameData.userId,
        timestamp: Date.now()
      };
      
      params.signature = this.generateSignature(params);
      
      const response = await axios.post(`${this.baseURL}/result`, params, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      return {
        winAmount: response.data.winAmount,
        multiplier: response.data.multiplier,
        isWin: response.data.winAmount > 0,
        gameData: response.data.gameData,
        roundId: response.data.roundId
      };
    } catch (error) {
      console.error('Error processing Pragmatic game result:', error);
      throw new Error('Failed to process game result');
    }
  }

  async getGameDetails(gameId) {
    try {
      const params = {
        gameId,
        operatorId: this.operatorId,
        timestamp: Date.now()
      };
      
      params.signature = this.generateSignature(params);
      
      const response = await axios.get(`${this.baseURL}/games/${gameId}`, {
        params,
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching Pragmatic game details:', error);
      throw new Error('Failed to get game details');
    }
  }

  validateConfig() {
    return !!(this.config.apiKey && this.config.operatorId && this.config.secretKey);
  }
}

module.exports = PragmaticProvider;
