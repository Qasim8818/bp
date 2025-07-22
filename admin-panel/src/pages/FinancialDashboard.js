import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Box,
  Chip
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const FinancialDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/admin/dashboard');
      setDashboardData(response.data.data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const { systemOverview, prizePool, topPlayers, dailyStats } = dashboardData;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Financial Dashboard
      </Typography>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Deposits
              </Typography>
              <Typography variant="h5">
                {formatCurrency(systemOverview.systemOverview.totalDeposits)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Withdrawals
              </Typography>
              <Typography variant="h5">
                {formatCurrency(systemOverview.systemOverview.totalWithdrawals)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                House Profit
              </Typography>
              <Typography variant="h5" color="success.main">
                {formatCurrency(systemOverview.systemOverview.houseProfit)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Prize Pool
              </Typography>
              <Typography variant="h5">
                {formatCurrency(prizePool.pool.currentBalance)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Prize Pool Health */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Prize Pool Stats
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Contributions: {formatCurrency(prizePool.pool.totalContributions)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Payouts: {formatCurrency(prizePool.pool.totalPayouts)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Net Balance: {formatCurrency(prizePool.pool.totalContributions - prizePool.pool.totalPayouts)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Overview
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Active Users: {systemOverview.systemOverview.activeUsers}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Bets: {formatCurrency(systemOverview.systemOverview.totalBets)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Wins: {formatCurrency(systemOverview.systemOverview.totalWins)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Players */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Top Players by Balance
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell align="right">Current Balance</TableCell>
                  <TableCell align="right">Deposited</TableCell>
                  <TableCell align="right">Withdrawn</TableCell>
                  <TableCell align="right">Winnings</TableCell>
                  <TableCell align="right">Net Profit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topPlayers.map((player) => (
                  <TableRow key={player._id}>
                    <TableCell>{player.username || 'Unknown'}</TableCell>
                    <TableCell align="right">{formatCurrency(player.currentBalance)}</TableCell>
                    <TableCell align="right">{formatCurrency(player.depositedAmount)}</TableCell>
                    <TableCell align="right">{formatCurrency(player.withdrawnAmount)}</TableCell>
                    <TableCell align="right">{formatCurrency(player.winningsAmount)}</TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={formatCurrency(player.netProfit)}
                        color={player.netProfit >= 0 ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Daily Stats */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Daily Transaction Volume
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={(item) => `${item._id.day}/${item._id.month}`}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line type="monotone" dataKey="deposits" stroke="#4caf50" name="Deposits" />
              <Line type="monotone" dataKey="withdrawals" stroke="#f44336" name="Withdrawals" />
              <Line type="monotone" dataKey="bets" stroke="#2196f3" name="Bets" />
              <Line type="monotone" dataKey="wins" stroke="#ff9800" name="Wins" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default FinancialDashboard;
