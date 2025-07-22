import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Users, DollarSign, Clock } from 'lucide-react';

const AdminDashboard = () => {
  const [stats] = useState({
    totalUsers: 1250,
    totalRevenue: 1250000,
    pendingDeposits: 45,
    pendingWithdrawals: 23
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <Users className="w-6 h-6 text-blue-600 mb-2" />
            <p className="text-sm font-medium text-gray-600">Total Users</p>
            <p className="text-2xl font-bold">{stats.totalUsers}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <DollarSign className="w-6 h-6 text-green-600 mb-2" />
            <p className="text-sm font-medium text-gray-600">Revenue</p>
            <p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <Clock className="w-6 h-6 text-red-600 mb-2" />
            <p className="text-sm font-medium text-gray-600">Pending Deposits</p>
            <p className="text-2xl font-bold">{stats.pendingDeposits}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <BarChart3 className="w-6 h-6 text-purple-600 mb-2" />
            <p className="text-sm font-medium text-gray-600">Pending Withdrawals</p>
            <p className="text-2xl font-bold">{stats.pendingWithdrawals}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6 space-y-4">
              <Link to="/admin/users" className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100">
                <Users className="w-5 h-5 inline mr-2" /> Manage Users
              </Link>
              <Link to="/admin/deposits" className="block p-4 bg-green-50 rounded-lg hover:bg-green-100">
                <DollarSign className="w-5 h-5 inline mr-2" /> Manage Deposits
              </Link>
              <Link to="/admin/withdrawals" className="block p-4 bg-red-50 rounded-lg hover:bg-red-100">
                <DollarSign className="w-5 h-5 inline mr-2" /> Manage Withdrawals
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">John Doe deposited $500</p>
                    <p className="text-xs text-gray-500">2 min ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Jane Smith won $200 on Coin Flip</p>
                    <p className="text-xs text-gray-500">5 min ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
