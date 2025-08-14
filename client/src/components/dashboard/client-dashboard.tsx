import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { i18n } from '@/lib/i18n';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
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
  Award
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { Order, Prescription, User } from '@/types/user';

interface ClientDashboardProps {
  userId: string;
}

export function ClientDashboard({ userId }: ClientDashboardProps) {
  const { data: orders = [] } = useQuery({
    queryKey: ['/api/orders', userId],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json() as Promise<Order[]>;
    },
  });

  const { data: prescriptions = [] } = useQuery({
    queryKey: ['/api/prescriptions', userId],
    queryFn: async () => {
      const response = await fetch(`/api/prescriptions/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch prescriptions');
      return response.json() as Promise<Prescription[]>;
    },
  });

  // Mock user data for demo
  const userData = {
    loyaltyPoints: 2450,
    loyaltyTier: 'silver',
    aiConsultations: 12,
    activePrescriptions: 3,
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'out_for_delivery':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'preparing':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'gold':
        return 'from-yellow-400 to-yellow-500';
      case 'silver':
        return 'from-gray-300 to-gray-400';
      default:
        return 'from-amber-600 to-amber-700';
    }
  };

  return (
    <div className="space-y-8">
      {/* Health Stats */}
      <motion.div 
        className="grid md:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-medical-mint to-medical-sage opacity-10"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Prescriptions</p>
                <p className="text-3xl font-bold text-foreground">{userData.activePrescriptions}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-medical-mint to-medical-sage rounded-xl flex items-center justify-center">
                <Pill className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 opacity-10"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">AI Consultations</p>
                <p className="text-3xl font-bold text-foreground">{userData.aiConsultations}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Bot className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-uzbek-blue to-primary-600 opacity-10"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Loyalty Points</p>
                <p className="text-3xl font-bold text-foreground">{userData.loyaltyPoints}</p>
                <div className="flex items-center mt-2">
                  <div className={`w-4 h-4 bg-gradient-to-r ${getTierColor(userData.loyaltyTier)} rounded-full mr-2`}></div>
                  <span className="text-sm text-muted-foreground capitalize">{userData.loyaltyTier} Tier</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-uzbek-blue to-primary-600 rounded-xl flex items-center justify-center">
                <Gift className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <motion.div 
          className="lg:col-span-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-primary" />
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No orders yet</p>
                  <Button className="mt-4" variant="outline">
                    Start Shopping
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order) => (
                    <div 
                      key={order.id}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-xl"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Order #{order.orderNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.deliveryMethod === 'yandex_delivery' ? 'Yandex Delivery' : 'Pharmacy Pickup'} • 
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="font-medium text-foreground">{order.totalAmount} UZS</p>
                          <Badge className={getOrderStatusColor(order.status)} variant="secondary">
                            {order.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* AI Assistant */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bot className="h-5 w-5 mr-2 text-primary" />
                AI Health Assistant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Ask questions about your health or upload prescriptions
              </p>
              <Button 
                className="w-full bg-gradient-to-r from-primary to-primary-600 hover:opacity-90 cursor-pointer"
                onClick={() => window.location.href = '/ai-consultation'}
                data-testid="ai-assistant-btn"
              >
                Start Conversation
              </Button>
            </CardContent>
          </Card>

          {/* Upload Prescription */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Camera className="h-5 w-5 mr-2 text-amber-500" />
                Upload Prescription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-6 text-center">
                <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">
                  Take a photo or upload prescription
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="cursor-pointer"
                  onClick={() => window.location.href = '/ai-consultation'}
                  data-testid="upload-image-btn"
                >
                  Upload Image
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Health Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                Health Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Medicine Adherence</span>
                  <span className="font-medium text-green-600">98%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">AI Consultations</span>
                  <span className="font-medium text-primary">{userData.aiConsultations}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Check-up</span>
                  <span className="font-medium text-muted-foreground">2 weeks ago</span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4">
                View Full Report
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Prescriptions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              Recent Prescriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {prescriptions.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No prescriptions uploaded</p>
                <Button className="mt-4" variant="outline">
                  <Camera className="h-4 w-4 mr-2" />
                  Upload Prescription
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {prescriptions.slice(0, 4).map((prescription) => (
                  <div 
                    key={prescription.id}
                    className="p-4 border border-border rounded-xl hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-foreground">
                          Dr. {prescription.doctorName || 'Unknown'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(prescription.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge 
                        className={prescription.isVerified 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
                        }
                        variant="secondary"
                      >
                        {prescription.isVerified ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </>
                        )}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
