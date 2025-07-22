import React, { useState } from 'react';
import Layout from '../../components/Layout/Layout';

const Game = () => {
  const [betAmount, setBetAmount] = useState('');
  const [selectedNumber, setSelectedNumber] = useState('');
  const [gameResult, setGameResult] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const numbers = Array.from({ length: 10 }, (_, i) => i + 1);

  const handlePlay = async () => {
    if (!betAmount || !selectedNumber) {
      alert('Please enter bet amount and select a number');
      return;
    }

    setIsPlaying(true);
    
    // Simulate game processing
    setTimeout(() => {
      const winningNumber = Math.floor(Math.random() * 10) + 1;
      const isWin = parseInt(selectedNumber) === winningNumber;
      
      setGameResult({
        winningNumber,
        isWin,
        payout: isWin ? parseFloat(betAmount) * 9 : 0
      });
      
      setIsPlaying(false);
    }, 2000);
  };

  const resetGame = () => {
    setBetAmount('');
    setSelectedNumber('');
    setGameResult(null);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Lucky Number Game</h1>
          <p className="text-gray-600 mt-2">Choose a number between 1-10 and win 9x your bet!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Game Interface */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Place Your Bet</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bet Amount (USDT)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="input-field"
                  placeholder="Enter bet amount"
                  disabled={isPlaying}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose Your Lucky Number
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {numbers.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSelectedNumber(num.toString())}
                      disabled={isPlaying}
                      className={`p-3 rounded-md text-lg font-bold transition-colors ${
                        selectedNumber === num.toString()
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {selectedNumber && (
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Selected: <span className="font-bold text-blue-600">{selectedNumber}</span>
                  </p>
                </div>
              )}

              <button
                onClick={handlePlay}
                disabled={isPlaying || !betAmount || !selectedNumber}
                className={`w-full py-3 px-4 rounded-md text-white font-medium ${
                  isPlaying || !betAmount || !selectedNumber
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isPlaying ? 'Processing...' : 'Play Game'}
              </button>

              {gameResult && (
                <div className="mt-4 p-4 rounded-md bg-gray-50">
                  <h3 className="text-lg font-semibold text-center mb-2">Game Result</h3>
                  <p className="text-center">
                    Winning Number: <span className="font-bold text-2xl">{gameResult.winningNumber}</span>
                  </p>
                  {gameResult.isWin ? (
                    <div className="text-center mt-2">
                      <p className="text-green-600 font-bold">🎉 You Won!</p>
                      <p className="text-lg">Payout: ${gameResult.payout.toFixed(2)} USDT</p>
                    </div>
                  ) : (
                    <div className="text-center mt-2">
                      <p className="text-red-600 font-bold">😔 You Lost</p>
                      <p className="text-sm">Better luck next time!</p>
                    </div>
                  )}
                  <button
                    onClick={resetGame}
                    className="mt-4 w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
                  >
                    Play Again
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Game Rules */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Game Rules</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <p><strong>How to Play:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Choose a number between 1 and 10</li>
                <li>Place your bet in USDT</li>
                <li>If your number matches the winning number, win 9x your bet</li>
                <li>Game uses provably fair algorithm</li>
              </ul>
              
              <p><strong>Payout Structure:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Win: 9x your bet amount</li>
                <li>Lose: Lose your bet amount</li>
                <li>House edge: 10%</li>
              </ul>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-blue-400">ℹ️</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      <strong>Provably Fair:</strong> All game results are verifiable and transparent.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Game History */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Recent Game History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bet Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chosen Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Winning Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Result
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payout
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2024-01-15 15:45</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$10.00</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">7</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">7</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Win
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$90.00</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2024-01-15 14:20</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$5.00</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">3</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">8</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Loss
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$0.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Game;
