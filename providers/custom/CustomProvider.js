const BaseProvider = require('../BaseProvider');
const GameResult = require('../../models/GameResult');
const User = require('../../models/User');
const playerPoolService = require('../../services/playerPoolService');
const Jackpot = require('../../models/Jackpot');
const { generateRandomNumber } = require('../../utils/rng');

class CustomProvider extends BaseProvider {
  constructor(config) {
    super('Custom', config);
    this.games = new Map([
      ['dice', { name: 'Dice Roll', minBet: 0.1, maxBet: 1000, rtp: 0.97 }],
      ['coin', { name: 'Coin Flip', minBet: 0.1, maxBet: 500, rtp: 0.98 }],
      ['number', { name: 'Lucky Number', minBet: 0.1, maxBet: 2000, rtp: 0.96 }],
      ['color', { name: 'Color Game', minBet: 0.1, maxBet: 1000, rtp: 0.95 }],
      ['roulette', { name: 'Roulette', minBet: 1, maxBet: 5000, rtp: 0.94 }],
      ['crash', { name: 'Crash Game', minBet: 0.5, maxBet: 1000, rtp: 0.97 }]
    ]);
    
    this.jackpotConfig = {
      minJackpot: 1000,
      maxJackpot: 100000,
      contributionRate: 0.01, // 1% of each bet goes to jackpot
      winProbability: 0.0001 // 0.01% chance per bet
    };
  }

  async initialize() {
    try {
      await prizePoolService.initializePool();
      // Ensure jackpot document exists
      await Jackpot.getCurrentJackpot();
      this.isActive = true;
      return true;
    } catch (error) {
      console.error('Custom Provider initialization failed:', error);
      this.isActive = false;
      return false;
    }
  }

  async getGames() {
    const jackpot = await Jackpot.getCurrentJackpot();
    return Array.from(this.games.entries()).map(([id, game]) => ({
      id,
      name: game.name,
      provider: 'Custom',
      category: 'custom',
      minBet: game.minBet,
      maxBet: game.maxBet,
      rtp: game.rtp,
      image: `/images/games/${id}.png`,
      description: `Play ${game.name} with custom jackpot features`,
      hasJackpot: true,
      jackpotAmount: jackpot.currentAmount
    }));
  }

  async launchGame(gameId, userData) {
    if (!this.games.has(gameId)) {
      throw new Error('Game not found');
    }

    const game = this.games.get(gameId);
    const sessionId = `custom_${gameId}_${Date.now()}_${userData.id}`;
    
    return {
      gameUrl: `/games/${gameId}?session=${sessionId}`,
      sessionId,
      gameConfig: {
        minBet: game.minBet,
        maxBet: game.maxBet,
        rtp: game.rtp,
        hasJackpot: true
      }
    };
  }

  async processGame(gameData) {
    const { gameId, betAmount, userChoice, userId, sessionId } = gameData;
    
    if (!this.games.has(gameId)) {
      throw new Error('Game not found');
    }

    const game = this.games.get(gameId);
    
    // Validate bet amount
    if (betAmount < game.minBet || betAmount > game.maxBet) {
      throw new Error('Invalid bet amount');
    }

    // Generate game result
    const result = await this.generateGameResult(gameId, userChoice, betAmount, game.rtp);
    
    // Check for jackpot win
    const jackpotResult = await this.checkJackpotWin(betAmount, userId);
    
    // Contribute to jackpot
    const contribution = betAmount * this.jackpotConfig.contributionRate;
    await Jackpot.contributeToJackpot(userId, contribution, gameId, null);

    // Calculate final win amount
    let totalWinAmount = result.winAmount;
    let jackpotWinAmount = 0;
    
    if (jackpotResult.won) {
      const jackpotAward = await Jackpot.awardJackpot(userId, jackpotResult.amount, gameId, null);
      jackpotWinAmount = jackpotAward.actualAmount;
      totalWinAmount += jackpotWinAmount;
    }

    // Save game result
    const gameResult = await GameResult.create({
      userId,
      gameType: gameId,
      betAmount,
      chosenValue: userChoice,
      resultValue: result.resultValue,
      winAmount: totalWinAmount,
      multiplier: result.multiplier,
      isWin: totalWinAmount > 0,
      gameHash: result.gameHash,
      nonce: result.nonce,
      serverSeed: result.serverSeed,
      clientSeed: result.clientSeed,
      jackpotWin: jackpotResult.won,
      jackpotAmount: jackpotWinAmount
    });

    // Update the gameResultId in jackpot records
    if (jackpotResult.won) {
      const jackpot = await Jackpot.getCurrentJackpot();
      const lastWin = jackpot.wins[jackpot.wins.length - 1];
      if (lastWin) {
        lastWin.gameResultId = gameResult._id;
        await jackpot.save();
      }
    }

    // Update user balance
    const user = await User.findById(userId);
    if (user) {
      user.balance += totalWinAmount;
      await user.save();
    }

    // Contribute to prize pool
    await prizePoolService.contributeToPool(betAmount, totalWinAmount, userId, gameResult._id);

    return {
      winAmount: totalWinAmount,
      multiplier: result.multiplier,
      isWin: totalWinAmount > 0,
      jackpotWin: jackpotResult.won,
      jackpotAmount: jackpotWinAmount,
      gameData: result,
      gameResultId: gameResult._id
    };
  }

  async generateGameResult(gameId, userChoice, betAmount, rtp) {
    const serverSeed = generateRandomNumber().toString();
    const clientSeed = generateRandomNumber().toString();
    const nonce = Math.floor(Math.random() * 1000000);
    
    let resultValue;
    let multiplier = 0;
    let isWin = false;

    switch (gameId) {
      case 'dice':
        resultValue = Math.floor(Math.random() * 6) + 1;
        isWin = parseInt(userChoice) === resultValue;
        multiplier = isWin ? 6 : 0;
        break;
        
      case 'coin':
        resultValue = Math.random() < 0.5 ? 'heads' : 'tails';
        isWin = userChoice === resultValue;
        multiplier = isWin ? 2 : 0;
        break;
        
      case 'number':
        resultValue = Math.floor(Math.random() * 100) + 1;
        const chosenNum = parseInt(userChoice);
        isWin = chosenNum === resultValue;
        multiplier = isWin ? 100 : 0;
        break;
        
      case 'color':
        const colors = ['red', 'green', 'blue', 'yellow'];
        resultValue = colors[Math.floor(Math.random() * colors.length)];
        isWin = userChoice === resultValue;
        multiplier = isWin ? 4 : 0;
        break;
        
      case 'roulette':
        const rouletteNumbers = Array.from({length: 37}, (_, i) => i);
        resultValue = rouletteNumbers[Math.floor(Math.random() * rouletteNumbers.length)];
        const chosenRoulette = parseInt(userChoice);
        isWin = chosenRoulette === resultValue;
        multiplier = isWin ? 36 : 0;
        break;
        
      case 'crash':
        const crashPoint = this.generateCrashPoint(rtp);
        resultValue = crashPoint.toString();
        const cashoutPoint = parseFloat(userChoice);
        isWin = cashoutPoint <= crashPoint;
        multiplier = isWin ? cashoutPoint : 0;
        break;
    }

    // Apply RTP adjustment
    const adjustedMultiplier = multiplier * rtp;
    
    return {
      resultValue: resultValue.toString(),
      winAmount: betAmount * adjustedMultiplier,
      multiplier: adjustedMultiplier,
      isWin,
      gameHash: this.generateGameHash(serverSeed, clientSeed, nonce),
      nonce,
      serverSeed,
      clientSeed
    };
  }

  generateCrashPoint(rtp) {
    const houseEdge = 1 - rtp;
    const random = Math.random();
    const crashPoint = Math.floor(100 / (1 - random * (1 - houseEdge))) / 100;
    return Math.max(1.01, Math.min(1000, crashPoint));
  }

  generateGameHash(serverSeed, clientSeed, nonce) {
    const crypto = require('crypto');
    return crypto.createHash('sha256')
      .update(`${serverSeed}-${clientSeed}-${nonce}`)
      .digest('hex');
  }

  async checkJackpotWin(betAmount, userId) {
    const jackpotChance = Math.random();
    
    if (jackpotChance < this.jackpotConfig.winProbability) {
      const jackpot = await Jackpot.getCurrentJackpot();
      const jackpotWin = Math.max(
        this.jackpotConfig.minJackpot,
        Math.min(jackpot.currentAmount, this.jackpotConfig.maxJackpot)
      );
      
      return {
        won: true,
        amount: jackpotWin
      };
    }
    
    return {
      won: false,
      amount: 0
    };
  }

  async getGameDetails(gameId) {
    if (!this.games.has(gameId)) {
      throw new Error('Game not found');
    }

    const game = this.games.get(gameId);
    const jackpotAmount = await this.getCurrentJackpot();

    return {
      id: gameId,
      name: game.name,
      provider: 'Custom',
      minBet: game.minBet,
      maxBet: game.maxBet,
      rtp: game.rtp,
      description: `Play ${game.name} with progressive jackpot`,
      rules: this.getGameRules(gameId),
      jackpot: {
        currentAmount: jackpotAmount,
        minWin: this.jackpotConfig.minJackpot,
        maxWin: this.jackpotConfig.maxJackpot,
        contributionRate: this.jackpotConfig.contributionRate,
        lastWin: this.jackpotConfig.lastJackpot,
        lastWinner: this.jackpotConfig.lastWinner
      }
    };
  }

  getGameRules(gameId) {
    const rules = {
      dice: 'Choose a number between 1-6. Win 6x if your number matches the roll.',
      coin: 'Choose heads or tails. Win 2x if you guess correctly.',
      number: 'Choose a number between 1-100. Win 100x if you hit the exact number.',
      color: 'Choose red, green, blue, or yellow. Win 4x if your color is drawn.',
      roulette: 'Choose a number 0-36. Win 36x if the ball lands on your number.',
      crash: 'Cash out before the crash. Multiplier increases until crash.'
    };
    
    return rules[gameId] || 'Standard game rules apply.';
  }

  async getJackpotStats() {
    const jackpot = await Jackpot.getCurrentJackpot();
    const jackpotHistory = await Jackpot.getJackpotHistory();
    const userStats = await Jackpot.getUserJackpotStats();
    
    return {
      currentAmount: jackpot.currentAmount,
      minJackpot: jackpot.minAmount,
      maxJackpot: jackpot.maxAmount,
      contributionRate: jackpot.contributionRate,
      winProbability: this.jackpotConfig.winProbability,
      lastWinAmount: jackpotHistory.lastWinAmount,
      lastWinner: jackpotHistory.lastWinner,
      lastWinDate: jackpotHistory.lastWinDate,
      totalContributions: jackpotHistory.totalContributions,
      totalWins: jackpotHistory.totalWins,
      userStats
    };
  }
}

module.exports = CustomProvider;
