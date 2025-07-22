import React, { useState } from 'react';
import Layout from '../../components/Layout/Layout';

const Wallet = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleSaveWallet = () => {
    console.log('Saving wallet address:', walletAddress);
    setShowModal(false);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Wallet Management</h1>
          <p className="text-gray-600 mt-2">Manage your wallet addresses for deposits and withdrawals</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Wallet Address */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Wallet Address</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  USDT (TRC20) Wallet Address
                </label>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm font-mono text-gray-600">
                    TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                Update Wallet Address
              </button>
            </div>
          </div>

          {/* Wallet Instructions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Wallet Instructions</h2>
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Important Notes:</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Only USDT (TRC20) addresses are supported</li>
                  <li>Make sure the address is correct before saving</li>
                  <li>All withdrawals will be sent to this address</li>
                  <li>Contact support if you need to change your wallet</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">How to find your wallet address:</h3>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Open your USDT wallet app (Trust Wallet, Binance, etc.)</li>
                  <li>Select USDT (TRC20) network</li>
                  <li>Copy your wallet address</li>
                  <li>Paste it in the field above</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Recent Wallet Activities</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2024-01-15</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Deposit</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$200.00</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Completed
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2024-01-14</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Withdrawal</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$100.00</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Completed
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Update Wallet Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Update Wallet Address</h3>
                <div className="mt-2 px-7 py-3">
                  <input
                    type="text"
                    placeholder="Enter USDT (TRC20) address"
                    className="input-field w-full"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                  />
                </div>
                <div className="items-center px-4 py-3">
                  <button
                    onClick={handleSaveWallet}
                    className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Save Address
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="mt-2 px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Wallet;
