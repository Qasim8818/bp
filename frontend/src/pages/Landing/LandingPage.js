import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700">
      {/* Navigation */}
      <nav className="bg-white/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-white text-xl font-bold">BetPro</div>
            <div className="flex space-x-4">
              <Link to="/login" className="text-white hover:text-gray-200 px-3 py-2">
                Login
              </Link>
              <Link to="/register" className="bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-gray-100">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Welcome to BetPro
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Experience fair and transparent betting with instant deposits and withdrawals. 
            Join thousands of players who trust our platform.
          </p>
          <div className="space-x-4">
            <Link to="/register" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100">
              Get Started
            </Link>
            <Link to="/login" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600">
              Login
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose BetPro?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Transactions</h3>
              <p className="text-gray-600">Fast deposits and withdrawals with secure payment processing</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Fair Gaming</h3>
              <p className="text-gray-600">Provably fair games with transparent algorithms</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🛡️</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Platform</h3>
              <p className="text-gray-600">Advanced security measures to protect your funds</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
