import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const walletService = {
  getWallet: () => api.get('/user/wallet'),
  addWalletAddress: (address) => api.post('/user/wallet', { address }),
  deposit: (amount) => api.post('/user/wallet/deposit', { amount }),
  withdraw: (amount) => api.post('/user/wallet/withdraw', { amount }),
};

export const gameService = {
  playGame: (gameType, betAmount) => api.post('/game/play', { gameType, betAmount }),
  getHistory: () => api.get('/user/history'),
};

export const transactionService = {
  getTransactions: () => api.get('/user/transactions'),
};

export const referralService = {
  getReferrals: () => api.get('/user/referral'),
  getReferralLink: () => api.get('/user/referral/link'),
};

export const supportService = {
  getTickets: () => api.get('/user/support'),
  createTicket: (subject, message) => api.post('/user/support', { subject, message }),
  replyToTicket: (ticketId, message) => api.post(`/user/support/${ticketId}/reply`, { message }),
};
