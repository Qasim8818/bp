import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Shield, Zap, Users, TrendingUp, Gift, Headphones } from 'lucide-react';

const EnhancedLandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Provably Fair",
      description: "All games use transparent algorithms you can verify"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Instant Withdrawals",
      description: "Get your winnings in minutes, not days"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "10K+ Active Players",
      description: "Join a thriving community of bettors"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "High RTP Games",
      description: "Up to 98% return to player rates"
    }
  ];

  const games = [
    {
      name: "Coin Flip",
      description: "Classic 50/50 chance game",
      multiplier: "2x",
      icon: "🪙"
    },
    {
      name: "Lucky Number",
      description: "Choose your lucky number 1-10",
      multiplier: "9x",
      icon: "🎯"
    },
    {
      name: "Color Game",
      description: "Red, Green, or Violet",
      multiplier: "2x-5x",
      icon: "🎨"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-white text-2xl font-bold">BetPro</div>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link to="/" className="text-white hover:text-gray-300 transition-colors">Home</Link>
              <Link to="/game" className="text-white hover:text-gray-300 transition-colors">Games</Link>
              <Link to="/support" className="text-white hover:text-gray-300 transition-colors">Support</Link>
            </nav>

            <div className="flex items-center space-x-4">
              <Link 
                to="/login" 
                className="text-white hover:text-gray-300 transition-colors"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg transition-all"
              >
                Sign Up
              </Link>
            </div>

            {/* Mobile menu button */}
            <button 
              className="md:hidden text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Experience Fair & Transparent
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {" "}Betting
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Join thousands of players who trust our provably fair platform. 
              Instant deposits, lightning-fast withdrawals, and games you can verify.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/register" 
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transition-all"
              >
                Start Playing Now
              </Link>
              <Link 
                to="/game" 
                className="border-2 border-white/30 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/10 transition-all"
              >
                Try Demo
              </Link>
            </div>
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute top-1/4 left-4 w-20 h-20 bg-blue-500/20 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-8 w-16 h-16 bg-purple-500/20 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-12 h-12 bg-pink-500/20 rounded-full animate-pulse delay-2000"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why Choose BetPro?
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Built for players who demand transparency, speed, and fairness
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-400">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Games Preview */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Popular Games
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Start with simple games and level up to more exciting challenges
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {games.map((game, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="text-4xl mb-4 text-center">{game.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{game.name}</h3>
                <p className="text-gray-300 mb-4">{game.description}</p>
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-3 text-center">
                  <span className="text-white font-bold">{game.multiplier}</span>
                  <span className="text-gray-300 text-sm ml-2">Multiplier</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Winning?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join now and get a 100% bonus on your first deposit
          </p>
          <Link 
            to="/register" 
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transition-all"
          >
            Claim Your Bonus
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">BetPro</h3>
              <p className="text-gray-400 text-sm">
                Fair and transparent betting platform built for the modern player.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Games</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/game" className="hover:text-white transition-colors">Coin Flip</Link></li>
                <li><Link to="/game" className="hover:text-white transition-colors">Lucky Number</Link></li>
                <li><Link to="/game" className="hover:text-white transition-colors">Color Game</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/support" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="/support" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link to="/support" className="hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/responsible" className="hover:text-white transition-colors">Responsible Gaming</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 text-center text-gray-400">
            <p>&copy; 2024 BetPro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EnhancedLandingPage;
