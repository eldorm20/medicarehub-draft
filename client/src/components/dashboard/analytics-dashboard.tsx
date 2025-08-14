import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  DollarSign, 
  Store, 
  Bot, 
  Pill, 
  TrendingUp, 
  TrendingDown,
  Users,
  Package,
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

interface AnalyticsData {
  revenue: number;
  orders: number;
  pharmacies: number;
  consultations: number;
}

export function AnalyticsDashboard() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/analytics'],
    queryFn: async () => {
      const response = await fetch('/api/analytics');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json() as Promise<AnalyticsData>;
    },
  });

  // Mock data for charts and additional metrics
  const mockData = {
    revenueGrowth: 12.5,
    ordersGrowth: 18.2,
    pharmaciesGrowth: 8.0,
    consultationsGrowth: 23.4,
    topMedicines: [
      { name: 'Paracetamol 500mg', sales: 1247, growth: 5.2 },
      { name: 'Ibuprofen 400mg', sales: 982, growth: -2.1 },
      { name: 'Vitamin C', sales: 856, growth: 8.7 },
      { name: 'Amoxicillin', sales: 743, growth: 3.4 },
      { name: 'Aspirin', sales: 621, growth: -1.5 },
    ],
    recentActivities: [
      { type: 'order', message: 'New order #UZ2024001 placed', time: '2 minutes ago' },
      { type: 'consultation', message: 'AI consultation completed', time: '5 minutes ago' },
      { type: 'pharmacy', message: 'New pharmacy "Central Pharm" added', time: '1 hour ago' },
      { type: 'alert', message: 'Low stock alert for Paracetamol', time: '2 hours ago' },
    ],
    regionalData: [
      { region: 'Tashkent', orders: 2456, revenue: 45231000 },
      { region: 'Samarkand', orders: 1832, revenue: 34567000 },
      { region: 'Bukhara', orders: 1245, revenue: 23456000 },
      { region: 'Fergana', orders: 987, revenue: 18765000 },
    ]
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const StatCard = ({ title, value, growth, icon: Icon, color }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5`}></div>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{title}</p>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              {growth !== undefined && (
                <div className="flex items-center mt-2">
                  {growth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(growth)}% from last month
                  </span>
                </div>
              )}
            </div>
            <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={analytics ? formatCurrency(analytics.revenue) : formatCurrency(1200000)}
          growth={mockData.revenueGrowth}
          icon={DollarSign}
          color="from-green-500 to-green-600"
        />
        <StatCard
          title="Active Pharmacies"
          value={analytics?.pharmacies || 247}
          growth={mockData.pharmaciesGrowth}
          icon={Store}
          color="from-blue-500 to-blue-600"
        />
        <StatCard
          title="AI Consultations"
          value={analytics?.consultations || 15300}
          growth={mockData.consultationsGrowth}
          icon={Bot}
          color="from-purple-500 to-purple-600"
        />
        <StatCard
          title="Medicine Orders"
          value={analytics?.orders || 8921}
          growth={mockData.ordersGrowth}
          icon={Pill}
          color="from-amber-500 to-amber-600"
        />
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="medicines">Medicines</TabsTrigger>
          <TabsTrigger value="regions">Regions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                  Revenue Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted/30 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Revenue chart would be displayed here</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Integration with Chart.js or Recharts needed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-primary" />
                  Recent Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockData.recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === 'alert' ? 'bg-red-500' :
                        activity.type === 'order' ? 'bg-green-500' :
                        activity.type === 'consultation' ? 'bg-purple-500' :
                        'bg-blue-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">This Month</span>
                    <span className="font-medium">{formatCurrency(1200000)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Last Month</span>
                    <span className="font-medium">{formatCurrency(1067000)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Growth</span>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      +12.5%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Click Payment</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 bg-muted rounded-full">
                        <div className="w-12 h-2 bg-primary rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium">65%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Payme</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 bg-muted rounded-full">
                        <div className="w-8 h-2 bg-green-500 rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium">30%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Cash</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 bg-muted rounded-full">
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium">5%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="medicines" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2 text-primary" />
                Popular Medicines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockData.topMedicines.map((medicine, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">{index + 1}</span>
                      </div>
                      <span className="text-sm text-foreground">{medicine.name}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-24 h-2 bg-muted rounded-full">
                          <div 
                            className="h-2 bg-primary rounded-full"
                            style={{ width: `${(medicine.sales / 1500) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground">{medicine.sales}</span>
                      </div>
                      <Badge 
                        className={medicine.growth >= 0 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        }
                        variant="secondary"
                      >
                        {medicine.growth >= 0 ? '+' : ''}{medicine.growth}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-primary" />
                Regional Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockData.regionalData.map((region, index) => (
                  <div key={index} className="p-4 border border-border rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-foreground">{region.region}</h4>
                      <Badge variant="outline">{region.orders} orders</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Revenue: {formatCurrency(region.revenue)}</span>
                      <span>Avg: {formatCurrency(region.revenue / region.orders)}/order</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
