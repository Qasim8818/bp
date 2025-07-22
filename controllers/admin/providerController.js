const BaseProvider = require('../../providers/BaseProvider');
const ProviderFactory = require('../../services/providerFactory');

class ProviderController {
  async getProviders(req, res) {
    try {
      const providers = await BaseProvider.find().populate('createdBy', 'email');
      res.json({
        success: true,
        data: providers
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getProvider(req, res) {
    try {
      const provider = await BaseProvider.findById(req.params.id);
      if (!provider) {
        return res.status(404).json({ message: 'Provider not found' });
      }
      res.json({
        success: true,
        data: provider
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async createProvider(req, res) {
    try {
      const {
        name,
        type,
        logicType,
        apiEndpoint,
        apiKey,
        config,
        isActive = true
      } = req.body;

      const existingProvider = await BaseProvider.findOne({ name });
      if (existingProvider) {
        return res.status(400).json({ message: 'Provider already exists' });
      }

      const provider = new BaseProvider({
        name,
        type,
        logicType,
        apiEndpoint,
        apiKey,
        config,
        isActive,
        createdBy: req.admin.id
      });

      await provider.save();
      
      res.status(201).json({
        success: true,
        data: provider,
        message: 'Provider created successfully'
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async updateProvider(req, res) {
    try {
      const provider = await BaseProvider.findByIdAndUpdate(
        req.params.id,
        { ...req.body, updatedAt: new Date() },
        { new: true }
      );

      if (!provider) {
        return res.status(404).json({ message: 'Provider not found' });
      }

      res.json({
        success: true,
        data: provider,
        message: 'Provider updated successfully'
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async deleteProvider(req, res) {
    try {
      const provider = await BaseProvider.findByIdAndDelete(req.params.id);
      if (!provider) {
        return res.status(404).json({ message: 'Provider not found' });
      }

      res.json({
        success: true,
        message: 'Provider deleted successfully'
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async toggleProviderStatus(req, res) {
    try {
      const provider = await BaseProvider.findById(req.params.id);
      if (!provider) {
        return res.status(404).json({ message: 'Provider not found' });
      }

      provider.isActive = !provider.isActive;
      await provider.save();

      res.json({
        success: true,
        data: provider,
        message: `Provider ${provider.isActive ? 'enabled' : 'disabled'} successfully`
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getProviderStats(req, res) {
    try {
      const provider = await BaseProvider.findById(req.params.id);
      if (!provider) {
        return res.status(404).json({ message: 'Provider not found' });
      }

      // Get game results for this provider
      const GameResult = require('../../models/GameResult');
      const results = await GameResult.find({ providerId: provider._id })
        .sort({ createdAt: -1 })
        .limit(100);

      const stats = {
        totalGames: results.length,
        totalBets: results.reduce((sum, r) => sum + r.betAmount, 0),
        totalWins: results.filter(r => r.winAmount > 0).length,
        totalPayouts: results.reduce((sum, r) => sum + r.winAmount, 0),
        profit: results.reduce((sum, r) => sum + (r.betAmount - r.winAmount), 0),
        recentResults: results.slice(0, 10)
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async simulateGameResult(req, res) {
    try {
      const { providerId, betAmount, userId } = req.body;

      const provider = await BaseProvider.findById(providerId);
      if (!provider) {
        return res.status(404).json({ message: 'Provider not found' });
      }

      // Simulate game result based on provider logic
      const factory = new ProviderFactory();
      const providerInstance = factory.createProvider(provider.logicType);
      
      const result = await providerInstance.simulateGame(betAmount);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = new ProviderController();
