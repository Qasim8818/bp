import React, { useState } from 'react';
import Layout from '../../components/Layout/Layout';

const Withdraw = () => {
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate withdrawal processing
    setTimeout(() => {
      console.log('Withdrawal:', { amount, walletAddress });
      alert('Withdrawal request submitted successfully!');
      setLoading(false);
      setAmount('');
      setWalletAddress('');
    }, 2000);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Withdraw Funds</h1>
          <p className="text-gray-600 mt-2">Withdraw your winnings to your USDT wallet</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Withdrawal Details</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Balance
                </label>
                <div className="bg-green-50 p-3 rounded-md">
                  <p className="text-lg font-semibold text-green-700">$1,250.50 USDT</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Withdrawal Amount (USDT)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="10"
                  max="1250.50"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-field"
                  placeholder="Enter amount to withdraw"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Minimum withdrawal: $10.00</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  USDT (TRC20) Wallet Address
                </label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="input-field"
                  placeholder="Enter your USDT wallet address"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Make sure this is your correct USDT (TRC20) address
                </p>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-yellow-400">⚠️</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <strong>Important:</strong> Withdrawals are processed within 5-30 minutes. 
                      Please ensure your wallet address is correct as transactions cannot be reversed.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? 'Processing...' : 'Request Withdrawal'}
              </button>
            </form>
          </div>

          {/* Withdrawal History */}
          <div className="mt-8 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Recent Withdrawals</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Wallet Address
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2024-01-15 16:45</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$150.00</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Completed
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      TQXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2024-01-14 12:30</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$75.00</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      TQXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Withdraw;
