import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Settings, 
  Shield, 
  Eye,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PrizePoolManagement = () => {
  const [poolStats, setPoolStats] = useState({
    currentBalance: 0,
    totalContributions: 0,
    totalPayouts: 0,
    contributionRate: 0.05,
    status: 'active'
  });
  
  const [winLossConfig, setWinLossConfig] = useState({
    targetRatio: 0.65,
    dailyWinCap: 1000,
    maxConsecutiveWins: 3,
    minDelayBetweenBigWins: 3600 // seconds
  });
  
  const [adminControls, setAdminControls] = useState({
    enableAdminWins: false,
    adminWinRate: 0.1,
    manualJackpotAmount: 500,
    enableRandomness: true
  });
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchPoolStats();
    fetchRecentActivity();
  }, []);

  const fetchPoolStats = async () => {
    try {
      const response = await fetch('/api/admin/prize-pool/stats');
      const data = await response.json();
      setPoolStats(data.data);
    } catch (error) {
      console.error('Error fetching pool stats:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch('/api/admin/prize-pool/history?limit=10');
      const data = await response.json();
      setRecentActivity(data.data.transactions || []);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const handlePoolAdjustment = async (adjustment) => {
    try {
      const response = await fetch('/api/admin/prize-pool/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adjustment })
      });
      
      if (response.ok) {
        fetchPoolStats();
        setAlerts([...alerts, {
          type: 'success',
          message: 'Pool adjusted successfully'
        }]);
      }
    } catch (error) {
      setAlerts([...alerts, {
        type: 'error',
        message: 'Failed to adjust pool'
      }]);
    }
  };

  const handleConfigUpdate = async (configType, newConfig) => {
    try {
      const response = await fetch(`/api/admin/prize-pool/config/${configType}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      
      if (response.ok) {
        setAlerts([...alerts, {
          type: 'success',
          message: `${configType} updated successfully`
        }]);
      }
    } catch (error) {
      setAlerts([...alerts, {
        type: 'error',
        message: `Failed to update ${configType}`
      }]);
    }
  };

  const triggerManualJackpot = async () => {
    try {
      const response = await fetch('/api/admin/prize-pool/trigger-jackpot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: adminControls.manualJackpotAmount })
      });
      
      if (response.ok) {
        setAlerts([...alerts, {
          type: 'success',
          message: 'Jackpot triggered successfully'
        }]);
        fetchPoolStats();
      }
    } catch (error) {
      setAlerts([...alerts, {
        type: 'error',
        message: 'Failed to trigger jackpot'
      }]);
    }
  };

  const getHealthColor = (balance) => {
    if (balance > 5000) return 'text-green-600';
    if (balance > 1000) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Prize Pool Management</h1>
        
        {/* Alerts */}
        {alerts.map((alert, index) => (
          <Alert key={index} className="mb-4" variant={alert.type === 'error' ? 'destructive' : 'default'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        ))}

        {/* Pool Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getHealthColor(poolStats.currentBalance)}`}>
                ${poolStats.currentBalance.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contributions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${poolStats.totalContributions.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${poolStats.totalPayouts.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contribution Rate</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(poolStats.contributionRate * 100).toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Win/Loss Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Win/Loss Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Target Win Ratio</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  min="0" 
                  max="1"
                  value={winLossConfig.targetRatio}
                  onChange={(e) => setWinLossConfig({...winLossConfig, targetRatio: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label>Daily Win Cap (per user)</Label>
                <Input 
                  type="number" 
                  value={winLossConfig.dailyWinCap}
                  onChange={(e) => setWinLossConfig({...winLossConfig, dailyWinCap: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label>Max Consecutive Wins</Label>
                <Input 
                  type="number" 
                  value={winLossConfig.maxConsecutiveWins}
                  onChange={(e) => setWinLossConfig({...winLossConfig, maxConsecutiveWins: parseInt(e.target.value)})}
                />
              </div>
              <Button onClick={() => handleConfigUpdate('win-loss', winLossConfig)}>
                Update Configuration
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="mr-2 h-5 w-5" />
                Admin Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  checked={adminControls.enableAdminWins}
                  onChange={(e) => setAdminControls({...adminControls, enableAdminWins: e.target.checked})}
                />
                <Label>Enable Admin Wins</Label>
              </div>
              <div>
                <Label>Admin Win Rate</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  min="0" 
                  max="1"
                  value={adminControls.adminWinRate}
                  onChange={(e) => setAdminControls({...adminControls, adminWinRate: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label>Manual Jackpot Amount</Label>
                <Input 
                  type="number" 
                  value={adminControls.manualJackpotAmount}
                  onChange={(e) => setAdminControls({...adminControls, manualJackpotAmount: parseInt(e.target.value)})}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  checked={adminControls.enableRandomness}
                  onChange={(e) => setAdminControls({...adminControls, enableRandomness: e.target.checked})}
                />
                <Label>Enable Randomness</Label>
              </div>
              <Button onClick={triggerManualJackpot} className="w-full">
                Trigger Manual Jackpot
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-gray-500">{new Date(activity.createdAt).toLocaleString()}</p>
                  </div>
                  <Badge variant={activity.amount > 0 ? "default" : "secondary"}>
                    ${activity.amount}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrizePoolManagement;
