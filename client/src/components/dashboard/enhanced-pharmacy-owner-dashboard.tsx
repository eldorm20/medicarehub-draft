import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  DollarSign, 
  Users, 
  Package,
  TrendingUp,
  BarChart3,
  ShoppingCart,
  AlertTriangle,
  UserCheck,
  Star,
  Target,
  Award,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';

interface PharmacyOwnerDashboardProps {
  userId: string;
}

export function EnhancedPharmacyOwnerDashboard({ userId }: PharmacyOwnerDashboardProps) {
  const ownerStats = {
    monthlyRevenue: 25750000,
    monthlyGrowth: 18.5,
    totalOrders: 2347,
    avgOrderValue: 10970,
    totalStaff: 12,
    activePharmacies: 3,
    customerSatisfaction: 4.9,
    lowStockItems: 23
  };

  const revenueData = [
    { month: 'Oct', revenue: 18500000, orders: 1890 },
    { month: 'Nov', revenue: 21300000, orders: 2156 },
    { month: 'Dec', revenue: 25750000, orders: 2347 }
  ];

  const categoryData = [
    { name: 'Pain Relief', value: 35, color: '#3b82f6' },
    { name: 'Antibiotics', value: 25, color: '#ef4444' },
    { name: 'Vitamins', value: 20, color: '#10b981' },
    { name: 'Cardiology', value: 12, color: '#f59e0b' },
    { name: 'Other', value: 8, color: '#8b5cf6' }
  ];

  const pharmacyPerformance = [
    { name: 'Pharmacy Central', revenue: 12500000, orders: 1247, rating: 4.9, staff: 5 },
    { name: 'Pharmacy Chilonzor', revenue: 8900000, orders: 892, rating: 4.8, staff: 4 },
    { name: 'Pharmacy Sergeli', revenue: 4350000, orders: 208, rating: 4.7, staff: 3 }
  ];

  return (
    <div className="space-y-8">
      {/* Executive Summary Cards */}
      <motion.div 
        className="grid md:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Monthly Revenue</p>
                <p className="text-2xl font-bold">{ownerStats.monthlyRevenue.toLocaleString()} UZS</p>
                <div className="flex items-center mt-2 text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span className="text-xs">+{ownerStats.monthlyGrowth}% from last month</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                <p className="text-3xl font-bold">{ownerStats.totalOrders}</p>
                <div className="flex items-center mt-2">
                  <Activity className="h-3 w-3 mr-1 text-blue-600" />
                  <span className="text-xs text-blue-600">Avg: {ownerStats.avgOrderValue.toLocaleString()} UZS</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Staff & Pharmacies</p>
                <p className="text-3xl font-bold">{ownerStats.totalStaff}</p>
                <div className="flex items-center mt-2 text-purple-600">
                  <Building2 className="h-3 w-3 mr-1" />
                  <span className="text-xs">{ownerStats.activePharmacies} pharmacies</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Satisfaction</p>
                <p className="text-3xl font-bold">{ownerStats.customerSatisfaction}</p>
                <div className="flex items-center mt-2 text-yellow-600">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  <span className="text-xs">Excellent rating</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Award className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Analytics Dashboard */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Revenue Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [
                        `${value.toLocaleString()} UZS`, 
                        'Revenue'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Sales by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pharmacy Performance & Management */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pharmacy Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Pharmacy Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pharmacyPerformance.map((pharmacy, index) => (
                <motion.div
                  key={index}
                  className="p-4 bg-muted/30 rounded-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{pharmacy.name}</h4>
                      <p className="text-sm text-muted-foreground">{pharmacy.staff} staff members</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center">
                        <Star className="h-3 w-3 text-yellow-500 mr-1 fill-current" />
                        <span className="text-sm font-medium">{pharmacy.rating}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                      <p className="font-bold">{pharmacy.revenue.toLocaleString()} UZS</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Orders</p>
                      <p className="font-bold">{pharmacy.orders}</p>
                    </div>
                  </div>
                  
                  <Progress 
                    value={(pharmacy.revenue / ownerStats.monthlyRevenue) * 100} 
                    className="mt-3" 
                  />
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Management Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserCheck className="h-5 w-5 mr-2" />
              Quick Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button className="h-16 flex-col space-y-1">
                <Users className="h-5 w-5" />
                <span className="text-xs">Manage Staff</span>
              </Button>
              <Button variant="outline" className="h-16 flex-col space-y-1">
                <Building2 className="h-5 w-5" />
                <span className="text-xs">Add Pharmacy</span>
              </Button>
              <Button variant="outline" className="h-16 flex-col space-y-1">
                <Package className="h-5 w-5" />
                <span className="text-xs">Inventory</span>
              </Button>
              <Button variant="outline" className="h-16 flex-col space-y-1">
                <BarChart3 className="h-5 w-5" />
                <span className="text-xs">Analytics</span>
              </Button>
            </div>

            {/* Critical Alerts */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
                <span className="font-medium text-amber-800">Requires Attention</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-amber-700">Low stock items</span>
                  <Badge className="bg-amber-100 text-amber-800">{ownerStats.lowStockItems}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700">Staff requests</span>
                  <Badge className="bg-amber-100 text-amber-800">3</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700">Pending approvals</span>
                  <Badge className="bg-amber-100 text-amber-800">7</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}