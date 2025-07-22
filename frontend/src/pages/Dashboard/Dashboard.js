import React, { useState } from 'react';
import Layout from '../../components/Layout/Layout';

const Dashboard = () => {
  const [userData] = useState({
    balance: 1250.50,
    totalDeposits: 5000,
    totalWithdrawals: 3750.50,
    totalBets: 45,
    totalWins: 28
  });

  const quickActions = [
    { title: 'Deposit', icon: '💰', path: '/deposit', color: 'bg-green-500' },
    { title: 'Withdraw', icon: '💸', path: '/withdraw', color: 'bg-blue-500' },
    { title: 'Play Game', icon: '🎮', path: '/game', color: 'bg-purple-500' },
    { title: 'View History', icon: '📊', path: '/history', color: 'bg-orange-500' }
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, User!</h1>
          <p className="text-gray-600 mt-2">Here's your account overview</p>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 mb-8">
          <div className="text-white">
            <h3 className="text-lg font-medium mb-2">Current Balance</h3>
            <p className="text-4xl font-bold">${userData.balance.toFixed(2)}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-green-600 text-xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Deposits</p>
                <p className="text-2xl font-bold text-gray-900">${userData.totalDeposits.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-blue-600 text-xl">💸</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Withdrawals</p>
                <p className="text-2xl font-bold text-gray-900">${userData.totalWithdrawals.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-purple-600 text-xl">🎮</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Bets</p>
                <p className="text-2xl font-bold text-gray-900">{userData.totalBets}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <span className="text-orange-600 text-xl">🏆</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Wins</p>
                <p className="text-2xl font-bold text-gray-900">{userData.totalWins}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                to={action.path}
                className={`${action.color} text-white p-4 rounded-lg text-center hover:opacity-90 transition-opacity`}
              >
                <div className="text-2xl mb-2">{action.icon}</div>
                <div className="font-medium">{action.title}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Game Win - Lucky Number</span>
              <span className="text-green-600 font-semibold">+$50.00</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Deposit via USDT</span>
              <span className="text-blue-600 font-semibold">+$200.00</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Withdrawal to Wallet</span>
              <span className="text-red-600 font-semibold">-$100.00</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
