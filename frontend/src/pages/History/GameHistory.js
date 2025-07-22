import React, { useState } from 'react';
import Layout from '../../components/Layout/Layout';

const GameHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Mock data for demonstration
  const gameHistory = [
    {
      id: 1,
      date: '2024-01-15 15:45',
      betAmount: 10.00,
      chosenNumber: 7,
      winningNumber: 7,
      result: 'win',
      payout: 90.00,
      status: 'completed'
    },
    {
      id: 2,
      date: '2024-01-15 14:20',
      betAmount: 5.00,
      chosenNumber: 3,
      winningNumber: 8,
      result: 'loss',
      payout: 0.00,
      status: 'completed'
    },
    {
      id: 3,
      date: '2024-01-14 12:30',
      betAmount: 20.00,
      chosenNumber: 5,
      winningNumber: 5,
      result: 'win',
      payout: 180.00,
      status: 'completed'
    },
    {
      id: 4,
      date: '2024-01-13 18:15',
      betAmount: 15.00,
      chosenNumber: 9,
      winningNumber: 2,
      result: 'loss',
      payout: 0.00,
      status: 'completed'
    },
    {
      id: 5,
      date: '2024-01-12 10:45',
      betAmount: 50.00,
      chosenNumber: 1,
      winningNumber: 1,
      result: 'win',
      payout: 450.00,
      status: 'completed'
    }
  ];

  const filteredHistory = gameHistory.filter(game => {
    const matchesSearch = game.id.toString().includes(searchTerm) || 
                          game.chosenNumber.toString().includes(searchTerm) ||
                          game.winningNumber.toString().includes(searchTerm);
    const matchesFilter = filterStatus === 'all' || game.result === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Game History</h1>
          <p className="text-gray-600 mt-2">View your past game results and statistics</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by ID, number, or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Results</option>
              <option value="win">Wins</option>
              <option value="loss">Losses</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
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
                {filteredHistory.map((game) => (
                  <tr key={game.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{game.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${game.betAmount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{game.chosenNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{game.winningNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          game.result === 'win'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {game.result === 'win' ? 'Win' : 'Loss'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${game.payout.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-4 bg-gray-50 border-t">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-700">
                  Showing {filteredHistory.length} of {gameHistory.length} results
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Load More
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GameHistory;
