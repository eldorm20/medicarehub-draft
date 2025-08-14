import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Heart, 
  Bot, 
  Pill, 
  Gift, 
  Clock, 
  CheckCircle, 
  Truck, 
  Camera,
  FileText,
  Activity,
  TrendingUp,
  Award,
  MapPin,
  Bell,
  Calendar,
  Star
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

interface ClientDashboardProps {
  userId: string;
}

export function EnhancedClientDashboard({ userId }: ClientDashboardProps) {
  const { data: orders = [] } = useQuery({
    queryKey: ['/api/orders', userId]
  });

  const { data: prescriptions = [] } = useQuery({
    queryKey: ['/api/prescriptions', userId]
  });

  // Enhanced user health data
  const userData = {
    loyaltyPoints: 3250,
    loyaltyTier: 'gold',
    aiConsultations: 18,
    activePrescriptions: 4,
    completedOrders: 23,
    savings: 125000,
    healthScore: 85,
    upcomingRefills: 2
  };

  const recentOrders = [
    {
      id: '1',
      orderNumber: 'ORD-2024-001',
      pharmacy: 'UzPharm Central',
      items: [
        { name: 'Paracetamol 500mg', quantity: 20 },
        { name: 'Vitamin D3 1000IU', quantity: 30 }
      ],
      total: 89000,
      status: 'delivered',
      deliveredAt: '2024-01-14',
      rating: 5
    },
    {
      id: '2',
      orderNumber: 'ORD-2024-002',
      pharmacy: 'UzPharm Chilonzor',
      items: [
        { name: 'Aspirin 100mg', quantity: 30 },
        { name: 'Omeprazole 20mg', quantity: 14 }
      ],
      total: 156000,
      status: 'out_for_delivery',
      estimatedDelivery: '2024-01-15'
    }
  ];

  const prescriptionReminders = [
    {
      medicine: 'Metformin 500mg',
      dosage: '2x daily',
      nextDue: '2024-01-16',
      daysLeft: 2,
      status: 'due_soon'
    },
    {
      medicine: 'Lisinopril 10mg',
      dosage: '1x daily',
      nextDue: '2024-01-18',
      daysLeft: 4,
      status: 'upcoming'
    }
  ];

  const healthTips = [
    {
      title: 'Winter Wellness',
      description: 'Stay healthy this winter with vitamin D supplements',
      category: 'Seasonal',
      urgent: false
    },
    {
      title: 'Medication Reminder',
      description: 'Take your blood pressure medication at the same time daily',
      category: 'Personal',
      urgent: true
    }
  ];

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'out_for_delivery': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-amber-100 text-amber-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'gold': return 'from-yellow-400 to-yellow-600';
      case 'silver': return 'from-gray-300 to-gray-500';
      default: return 'from-amber-600 to-amber-800';
    }
  };

  const getTierIcon = (tier: string) => {
    return tier === 'gold' ? <Award className="h-4 w-4" /> : <Gift className="h-4 w-4" />;
  };

  return (
    <div className="space-y-8">
      {/* Health Overview Cards */}
      <motion.div 
        className="grid md:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Prescriptions</p>
                <p className="text-3xl font-bold">{userData.activePrescriptions}</p>
                <div className="flex items-center mt-2 text-blue-600">
                  <Clock className="h-3 w-3 mr-1" />
                  <span className="text-xs">{userData.upcomingRefills} due soon</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <Pill className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">AI Consultations</p>
                <p className="text-3xl font-bold">{userData.aiConsultations}</p>
                <div className="flex items-center mt-2 text-purple-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span className="text-xs">+3 this month</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Bot className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${getTierColor(userData.loyaltyTier)}/10`}></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Loyalty Points</p>
                <p className="text-3xl font-bold">{userData.loyaltyPoints}</p>
                <div className={`flex items-center mt-2 bg-gradient-to-r ${getTierColor(userData.loyaltyTier)} bg-clip-text text-transparent`}>
                  {getTierIcon(userData.loyaltyTier)}
                  <span className="text-xs ml-1 capitalize">{userData.loyaltyTier} Member</span>
                </div>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-br ${getTierColor(userData.loyaltyTier)} rounded-xl flex items-center justify-center`}>
                <Gift className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Health Score</p>
                <p className="text-3xl font-bold">{userData.healthScore}</p>
                <div className="flex items-center mt-2 text-green-600">
                  <Heart className="h-3 w-3 mr-1" />
                  <span className="text-xs">Excellent health</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Activity className="h-6 w-6 text-white" />
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
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  Recent Orders
                </div>
                <Button size="sm" variant="outline">View All</Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    className="p-4 border rounded-lg bg-muted/20"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold">{order.orderNumber}</p>
                        <p className="text-sm text-muted-foreground flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {order.pharmacy}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{order.total.toLocaleString()} UZS</p>
                        <Badge className={getOrderStatusColor(order.status)}>
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-1 mb-3">
                      {order.items.map((item, idx) => (
                        <p key={idx} className="text-sm text-muted-foreground">
                          {item.name} × {item.quantity}
                        </p>
                      ))}
                    </div>

                    <div className="flex justify-between items-center">
                      {order.status === 'delivered' ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          <span className="text-sm">Delivered {order.deliveredAt}</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-blue-600">
                          <Clock className="h-4 w-4 mr-1" />
                          <span className="text-sm">Expected {order.estimatedDelivery}</span>
                        </div>
                      )}
                      
                      {order.rating && (
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-3 w-3 ${i < order.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Health Reminders & Actions */}
        <div className="space-y-6">
          {/* Prescription Reminders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2 text-amber-600" />
                Prescription Reminders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {prescriptionReminders.map((reminder, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg border-l-4 ${
                      reminder.status === 'due_soon' 
                        ? 'border-l-red-500 bg-red-50' 
                        : 'border-l-amber-500 bg-amber-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-medium text-sm">{reminder.medicine}</p>
                      <Badge className={
                        reminder.status === 'due_soon' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-amber-100 text-amber-800'
                      }>
                        {reminder.daysLeft}d
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{reminder.dosage}</p>
                    <div className="flex items-center mt-2">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span className="text-xs">Next: {reminder.nextDue}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Health Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button className="h-16 flex-col space-y-1 bg-primary hover:bg-primary/90">
                  <Camera className="h-5 w-5" />
                  <span className="text-xs">Upload Rx</span>
                </Button>
                <Button variant="outline" className="h-16 flex-col space-y-1">
                  <Bot className="h-5 w-5" />
                  <span className="text-xs">AI Consult</span>
                </Button>
                <Button variant="outline" className="h-16 flex-col space-y-1">
                  <Pill className="h-5 w-5" />
                  <span className="text-xs">Find Medicine</span>
                </Button>
                <Button variant="outline" className="h-16 flex-col space-y-1">
                  <FileText className="h-5 w-5" />
                  <span className="text-xs">Health Report</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Health Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="h-5 w-5 mr-2 text-pink-600" />
                Health Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {healthTips.map((tip, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg ${
                      tip.urgent 
                        ? 'bg-rose-50 border border-rose-200' 
                        : 'bg-blue-50 border border-blue-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-medium text-sm">{tip.title}</p>
                      <Badge className={
                        tip.urgent 
                          ? 'bg-rose-100 text-rose-800' 
                          : 'bg-blue-100 text-blue-800'
                      }>
                        {tip.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{tip.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}