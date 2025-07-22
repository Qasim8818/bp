const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const gameLobbyService = require('./services/gameLobbyService');
const enhancedPrizePoolService = require('./services/enhancedPrizePoolService');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Initialize services
async function initializeServices() {
  try {
    await gameLobbyService.initialize();
    console.log('Game lobby service initialized');
    
    // Initialize enhanced prize pool service
    await enhancedPrizePoolService.getComprehensivePoolStats();
    console.log('Enhanced prize pool service initialized');
  } catch (error) {
    console.error('Failed to initialize services:', error);
  }
}

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/games', require('./routes/gameRoutes'));
app.use('/api/games/spin', require('./routes/game/spinRoutes'));
app.use('/api/withdrawals', require('./routes/withdrawals'));
app.use('/api/admin/profit', require('./routes/admin/adminProfitRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    providers: gameLobbyService.getProviderStatus ? gameLobbyService.getProviderStatus() : []
  });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/betting-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initializeServices();
});
