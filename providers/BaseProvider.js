/**
 * Base Provider Class - Abstract base for all game providers
 * Handles common functionality for external and custom providers
 */
class BaseProvider {
  constructor(name, config) {
    this.name = name;
    this.config = config;
    this.isActive = true;
    this.games = new Map();
  }

  /**
   * Initialize provider connection
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    throw new Error('initialize() must be implemented by subclass');
  }

  /**
   * Get available games from this provider
   * @returns {Promise<Array>} Array of game objects
   */
  async getGames() {
    throw new Error('getGames() must be implemented by subclass');
  }

  /**
   * Launch a specific game
   * @param {string} gameId - Game identifier
   * @param {Object} userData - User information
   * @returns {Promise<Object>} Game session data
   */
  async launchGame(gameId, userData) {
    throw new Error('launchGame() must be implemented by subclass');
  }

  /**
   * Process game result/spin
   * @param {Object} gameData - Game session data
   * @returns {Promise<Object>} Game result
   */
  async processGame(gameData) {
    throw new Error('processGame() must be implemented by subclass');
  }

  /**
   * Get game details
   * @param {string} gameId - Game identifier
   * @returns {Promise<Object>} Game details
   */
  async getGameDetails(gameId) {
    throw new Error('getGameDetails() must be implemented by subclass');
  }

  /**
   * Validate provider configuration
   * @returns {boolean} Configuration validity
   */
  validateConfig() {
    return !!(this.config && this.config.apiKey);
  }

  /**
   * Get provider status
   * @returns {Object} Provider status
   */
  getStatus() {
    return {
      name: this.name,
      isActive: this.isActive,
      gamesCount: this.games.size,
      configValid: this.validateConfig()
    };
  }
}

module.exports = BaseProvider;
