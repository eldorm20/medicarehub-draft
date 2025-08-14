import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  Truck,
  DollarSign,
  Star,
  Activity,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';

interface PharmacySellerDashboardProps {
  userId: string;
}

export function EnhancedPharmacySellerDashboard({ userId }: PharmacySellerDashboardProps) {
  const sellerStats = {
    pendingOrders: 23,
    completedToday: 45,
    totalCustomers: 312,
    revenue: 2850000,
    rating: 4.8,
    lowStock: 8
  };

  const recentOrders = [
    {
      id: '1',
      orderNumber: 'ORD-001',
      customerName: 'Alisher Navoiy',
      items: 3,
      total: 125000,
      status: 'pending',
      priority: 'high'
    },
    {
      id: '2', 
      orderNumber: 'ORD-002',
      customerName: 'Shoira Mirziyoyeva',
      items: 2,
      total: 89000,
      status: 'preparing',
      priority: 'normal'
    },
    {
      id: '3',
      orderNumber: 'ORD-003',
      customerName: 'Bobur Umarov',
      items: 5,
      total: 234000,
      status: 'ready',
      priority: 'urgent'
    }
  ];

  const lowStockItems = [
    { name: 'Paracetamol 500mg', current: 5, min: 20, category: 'Pain Relief' },
    { name: 'Aspirin 100mg', current: 8, min: 15, category: 'Cardiology' },
    { name: 'Vitamin D3 1000IU', current: 12, min: 25, category: 'Vitamins' },
    { name: 'Amoxicillin 250mg', current: 3, min: 30, category: 'Antibiotics' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500 bg-red-50';
      case 'high': return 'border-l-orange-500 bg-orange-50';
      default: return 'border-l-blue-500 bg-blue-50';
    }
  };

  return (
    <div className="space-y-8">
      {/* Key Performance Indicators */}
      <motion.div 
        className="grid md:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending Orders</p>
                <p className="text-3xl font-bold">{sellerStats.pendingOrders}</p>
                <div className="flex items-center mt-2 text-amber-600">
                  <Clock className="h-3 w-3 mr-1" />
                  <span className="text-xs">Needs attention</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Completed Today</p>
                <p className="text-3xl font-bold">{sellerStats.completedToday}</p>
                <div className="flex items-center mt-2 text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span className="text-xs">+12% from yesterday</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Daily Revenue</p>
                <p className="text-2xl font-bold">{sellerStats.revenue.toLocaleString()} UZS</p>
                <div className="flex items-center mt-2 text-blue-600">
                  <Star className="h-3 w-3 mr-1" />
                  <span className="text-xs">{sellerStats.rating}/5.0 rating</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Customers</p>
                <p className="text-3xl font-bold">{sellerStats.totalCustomers}</p>
                <div className="flex items-center mt-2 text-purple-600">
                  <Activity className="h-3 w-3 mr-1" />
                  <span className="text-xs">+8 new this week</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Dashboard Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Recent Orders
              </CardTitle>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                New Order
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    className={`flex items-center justify-between p-4 rounded-lg border-l-4 ${getPriorityColor(order.priority)}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold text-lg">{order.orderNumber}</p>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground">{order.items} items</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{order.total.toLocaleString()} UZS</p>
                      <div className="flex space-x-2 mt-2">
                        <Button size="sm" variant="outline">View</Button>
                        <Button size="sm">Process</Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock & Quick Actions */}
        <div className="space-y-6">
          {/* Low Stock Alert */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-amber-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Low Stock Alerts
                <Badge className="ml-2 bg-amber-100 text-amber-800">
                  {sellerStats.lowStock}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockItems.map((item, index) => (
                  <div key={index} className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                      </div>
                      <Button size="sm" className="h-6 text-xs">
                        Reorder
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress 
                        value={(item.current / item.min) * 100} 
                        className="flex-1 h-2" 
                      />
                      <span className="text-xs font-medium">
                        {item.current}/{item.min}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button className="h-16 flex-col space-y-1 bg-primary hover:bg-primary/90">
                  <Package className="h-5 w-5" />
                  <span className="text-xs">Add Medicine</span>
                </Button>
                <Button variant="outline" className="h-16 flex-col space-y-1">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="text-xs">New Order</span>
                </Button>
                <Button variant="outline" className="h-16 flex-col space-y-1">
                  <Users className="h-5 w-5" />
                  <span className="text-xs">Customers</span>
                </Button>
                <Button variant="outline" className="h-16 flex-col space-y-1">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-xs">Reports</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}