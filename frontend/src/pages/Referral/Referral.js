import React, { useState } from 'react';
import Layout from '../../components/Layout/Layout';

const Referral = () => {
  const [referralCode] = useState('BETPRO123');
  const [referralLink] = useState('https://betpro.com/register?ref=BETPRO123');
  const [copied, setCopied] = useState(false);

  const referralStats = {
    totalReferrals: 15,
    activeReferrals: 12,
    totalEarnings: 450.00,
    pendingEarnings: 75.00
  };

  const recentReferrals = [
    { id: 1, username: 'user123', date: '2024-01-15', earnings: 25.00 },
    { id: 2, username: 'player456', date: '2024-01-14', earnings: 15.00 },
    { id: 3, username: 'gamer789', date: '2024-01-13', earnings: 35.00 }
  ];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Referral Program</h1>
          <p className="text-gray-600 mt-2">Invite friends and earn 10% of their deposits</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Referral Stats */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <span className="text-blue-600 text-xl">👥</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                    <p className="text-2xl font-bold text-gray-900">{referralStats.totalReferrals}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <span className="text-green-600 text-xl">💰</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                    <p className="text-2xl font-bold text-gray-900">${referralStats.totalEarnings.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <span className="text-purple-600 text-xl">✅</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Referrals</p>
                    <p className="text-2xl font-bold text-gray-900">{referralStats.activeReferrals}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <span className="text-yellow-600 text-xl">⏳</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">${referralStats.pendingEarnings.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Referrals */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Recent Referrals</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Username
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Earnings
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentReferrals.map((referral) => (
                      <tr key={referral.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{referral.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{referral.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${referral.earnings.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Referral Link */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Referral Link</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Referral Code</label>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-lg font-mono font-bold text-center">{referralCode}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Referral Link</label>
                <div className="flex">
                  <input
                    type="text"
                    value={referralLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-blue-400">💡</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      Share your referral link with friends and earn 10% of their deposits forever!
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <h3 className="font-medium text-gray-900">How it works:</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Share your unique referral link</li>
                  <li>Friends register using your link</li>
                  <li>They make deposits</li>
                  <li>You earn 10% commission instantly</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Referral;
