import React, { useState } from 'react';
import Layout from '../../components/Layout/Layout';

const Deposit = () => {
  const [amount, setAmount] = useState('');
  const [paymentProof, setPaymentProof] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('usdt');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPaymentProof(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Deposit:', { amount, paymentProof, selectedMethod });
    alert('Deposit request submitted successfully!');
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Deposit Funds</h1>
          <p className="text-gray-600 mt-2">Add funds to your account using USDT (TRC20)</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Deposit Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Deposit Details</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Payment Method
                </label>
                <select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="input-field"
                >
                  <option value="usdt">USDT (TRC20)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (USDT)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="10"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-field"
                  placeholder="Enter amount (minimum $10)"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Proof (Screenshot)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="input-field"
                  required
                />
                {paymentProof && (
                  <p className="text-sm text-gray-600 mt-1">
                    Selected: {paymentProof.name}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                Submit Deposit Request
              </button>
            </form>
          </div>

          {/* Deposit Instructions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">How to Deposit</h2>
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Step 1: Get Wallet Address</h3>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="font-mono text-sm break-all">
                    TQXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
                  </p>
                  <button className="mt-2 text-blue-600 text-sm hover:underline">
                    Copy Address
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Step 2: Send USDT</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Open your USDT wallet (Trust Wallet, Binance, etc.)</li>
                  <li>Select USDT (TRC20) network</li>
                  <li>Send the exact amount to the address above</li>
                  <li>Take a screenshot of the transaction</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Step 3: Submit Proof</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Upload the transaction screenshot</li>
                  <li>Submit the deposit request</li>
                  <li>Wait for approval (usually 5-30 minutes)</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-yellow-400">⚠️</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <strong>Important:</strong> Only send USDT (TRC20) to this address. 
                      Sending any other token may result in permanent loss of funds.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Deposits */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Recent Deposits</h2>
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
                    Transaction ID
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2024-01-15 14:30</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$200.00</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Completed
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    TX123456789
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2024-01-14 10:15</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$100.00</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Completed
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    TX987654321
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Deposit;
