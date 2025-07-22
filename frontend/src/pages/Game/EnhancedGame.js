import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import MobileNavigation from '../../components/MobileNavigation';
import { Play, RotateCcw, Trophy, Clock, Target, Coins, Palette } from 'lucide-react';

const EnhancedGame = () => {
  const [selectedGame, setSelectedGame] = useState('coin-flip');
  const [betAmount, setBetAmount] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [balance, setBalance] = useState(1250.50);

  // Game-specific states
  const [coinChoice, setCoinChoice] = useState('heads');
  const [diceNumber, setDiceNumber] = useState(1);
  const [colorChoice, setColorChoice] = useState('red');

  const games = [
    {
      id: 'coin-flip',
      name: 'Coin Flip',
      icon: <Coins className="w-6 h-6" />,
      description: 'Classic 50/50 chance game',
      multiplier: '2x',
      minBet: 1,
      maxBet: 1000
    },
    {
      id: 'lucky-number',
      name: 'Lucky Number',
      icon: <Target className="w-6 h-6" />,
      description: 'Choose 1-10, win 9x',
      multiplier: '9x',
      minBet: 1,
      maxBet: 500
    },
    {
      id: 'color-game',
      name: 'Color Game',
      icon: <Palette className="w-6 h-6" />,
      description: 'Red, Green, or Violet',
      multiplier: '2x-5x',
      minBet: 1,
      maxBet: 200
    }
  ];

  const handlePlay = async () => {
    if (!betAmount || parseFloat(betAmount) > balance) {
      alert('Invalid bet amount or insufficient balance');
      return;
    }

    setIsPlaying(true);
    
    // Simulate game processing
    setTimeout(() => {
      let result = {};
      
      switch (selectedGame) {
        case 'coin-flip':
          const coinResult = Math.random() < 0.5 ? 'heads' : 'tails';
          const coinWin = coinResult === coinChoice;
          result = {
            type: 'coin-flip',
            win: coinWin,
            outcome: coinResult,
            payout: coinWin ? parseFloat(betAmount) * 2 : 0
          };
          break;
          
        case 'lucky-number':
          const winningNumber = Math.floor(Math.random() * 10) + 1;
          const numberWin = winningNumber === diceNumber;
          result = {
            type: 'lucky-number',
            win: numberWin,
            outcome: winningNumber,
            payout: numberWin ? parseFloat(betAmount) * 9 : 0
          };
          break;
          
        case 'color-game':
          const colors = ['red', 'green', 'violet'];
          const colorResult = colors[Math.floor(Math.random() * colors.length)];
          const colorWin = colorResult === colorChoice;
          const multipliers = { red: 2, green: 3, violet: 5 };
          result = {
            type: 'color-game',
            win: colorWin,
            outcome: colorResult,
            payout: colorWin ? parseFloat(betAmount) * multipliers[colorChoice] : 0
          };
          break;
      }
      
      setGameResult(result);
      if (result.win) {
        setBalance(prev => prev + result.payout);
      } else {
        setBalance(prev => prev - parseFloat(betAmount));
      }
      setIsPlaying(false);
    }, 2000);
  };

  const resetGame = () => {
    setGameResult(null);
    setBetAmount('');
  };

  const currentGame = games.find(g => g.id === selectedGame);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {/* Balance Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-blue-100 text-sm">Available Balance</p>
              <p className="text-3xl font-bold">${balance.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-sm">Total Won Today</p>
              <p className="text-xl font-semibold">$125.50</p>
            </div>
          </div>
        </div>

        {/* Game Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => setSelectedGame(game.id)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedGame === game.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {game.icon}
                  <span className="font-semibold">{game.name}</span>
                </div>
                <span className="text-sm font-bold text-green-600">{game.multiplier}</span>
              </div>
              <p className="text-sm text-gray-600">{game.description}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Interface */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6">{currentGame.name}</h2>

              {/* Game-specific UI */}
              {selectedGame === 'coin-flip' && (
                <div className="space-y-6">
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => setCoinChoice('heads')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        coinChoice === 'heads'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-4xl">🪙</div>
                      <div className="mt-2 font-semibold">Heads</div>
                    </button>
                    <button
                      onClick={() => setCoinChoice('tails')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        coinChoice === 'tails'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-4xl">🪙</div>
                      <div className="mt-2 font-semibold">Tails</div>
                    </button>
                  </div>
                </div>
              )}

              {selectedGame === 'lucky-number' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Choose your lucky number (1-10)
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                        <button
                          key={num}
                          onClick={() => setDiceNumber(num)}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            diceNumber === num
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedGame === 'color-game' && (
                <div className="space-y-6">
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => setColorChoice('red')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        colorChoice === 'red'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="w-12 h-12 bg-red-500 rounded-full mb-2"></div>
                      <div className="font-semibold">Red</div>
                      <div className="text-sm text-gray-600">2x</div>
                    </button>
                    <button
                      onClick={() => setColorChoice('green')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        colorChoice === 'green'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="w-12 h-12 bg-green-500 rounded-full mb-2"></div>
                      <div className="font-semibold">Green</div>
                      <div className="text-sm text-gray-600">3x</div>
                    </button>
                    <button
                      onClick={() => setColorChoice('violet')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        colorChoice === 'violet'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="w-12 h-12 bg-purple-500 rounded-full mb-2"></div>
                      <div className="font-semibold">Violet</div>
                      <div className="text-sm text-gray-600">5x</div>
                    </button>
                  </div>
                </div>
              )}

              {/* Bet Amount */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bet Amount (USDT)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    step="0.01"
                    min={currentGame.minBet}
                    max={currentGame.maxBet}
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="flex-1 form-input"
                    placeholder={`Min: ${currentGame.minBet} USDT`}
                    disabled={isPlaying}
                  />
                  <button
                    onClick={() => setBetAmount((balance * 0.1).toFixed(2))}
                    className="px-3 py-2 bg-gray-100 rounded-md text-sm"
                  >
                    10%
                  </button>
                  <button
                    onClick={() => setBetAmount((balance * 0.5).toFixed(2))}
                    className="px-3 py-2 bg-gray-100 rounded-md text-sm"
                  >
                    50%
                  </button>
                </div>
              </div>

              {/* Play Button */}
              <button
                onClick={handlePlay}
                disabled={isPlaying || !betAmount || parseFloat(betAmount) > balance}
                className="w-full mt-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPlaying ? (
                  <div className="flex items-center justify-center">
                    <RotateCcw className="w-5 h-5 animate-spin mr-2" />
                    Playing...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Play className="w-5 h-5 mr-2" />
                    Play {currentGame.name}
                  </div>
                )}
              </button>

              {/* Game Result */}
              {gameResult && (
                <div className="mt-6 p-4 rounded-lg bg-gray-50">
                  <div className="text-center">
                    <Trophy className={`w-12 h-12 mx-auto mb-2 ${gameResult.win ? 'text-yellow-500' : 'text-gray-400'}`} />
                    <h3 className="text-lg font-semibold mb-2">
                      {gameResult.win ? '🎉 You Won!' : '😔 You Lost'}
                    </h3>
                    <p className="text-gray-600">
                      {gameResult.type === 'coin-flip' && `Coin landed on: ${gameResult.outcome}`}
                      {gameResult.type === 'lucky-number' && `Winning number: ${gameResult.outcome}`}
                      {gameResult.type === 'color-game' && `Color was: ${gameResult.outcome}`}
                    </p>
                    {gameResult.win && (
                      <p className="text-green-600 font-bold text-xl mt-2">
                        +${gameResult.payout.toFixed(2)} USDT
                      </p>
                    )}
                    <button
                      onClick={resetGame}
                      className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      Play Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Game Stats */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Game Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Plays</span>
                  <span className="font-semibold">127</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Win Rate</span>
                  <span className="font-semibold text-green-600">48%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Won</span>
                  <span className="font-semibold text-green-600">$1,245.50</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Games</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">Coin Flip</p>
                    <p className="text-gray-500">2 min ago</p>
                  </div>
                  <span className="text-green-600 font-semibold">+$20.00</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">Lucky Number</p>
                    <p className="text-gray-500">5 min ago</p>
                  </div>
                  <span className="text-red-600 font-semibold">-$10.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MobileNavigation />
    </Layout>
  );
};

export default EnhancedGame;
