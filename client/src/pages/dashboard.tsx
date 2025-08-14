import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { EnhancedClientDashboard } from '@/components/dashboard/enhanced-client-dashboard';
import { EnhancedPharmacySellerDashboard } from '@/components/dashboard/enhanced-pharmacy-seller-dashboard';
import { EnhancedPharmacyOwnerDashboard } from '@/components/dashboard/enhanced-pharmacy-owner-dashboard';
import { AnalyticsDashboard } from '@/components/dashboard/analytics-dashboard';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { 
  User, 
  Store, 
  Building, 
  Crown,
  Activity,
  BarChart3,
  Package,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();

  // Mock user for demo - in production this would come from auth
  const mockUser = {
    id: 'user123',
    role: 'client' as const,
    firstName: 'John',
    lastName: 'Doe',
  };

  const currentUser = user || mockUser;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'client':
        return User;
      case 'pharmacy_seller':
        return Store;
      case 'pharmacy_owner':
        return Building;
      case 'super_admin':
        return Crown;
      default:
        return User;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'client':
        return t('dashboard.client_title') || 'Client Dashboard';
      case 'pharmacy_seller':
        return t('dashboard.seller_title') || 'Pharmacy Seller Dashboard';
      case 'pharmacy_owner':
        return t('dashboard.owner_title') || 'Pharmacy Owner Dashboard';
      case 'super_admin':
        return t('dashboard.admin_title') || 'SuperAdmin Dashboard';
      default:
        return t('navigation.dashboard') || 'Dashboard';
    }
  };

  const RoleIcon = getRoleIcon(currentUser.role);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-primary to-primary-600 rounded-xl flex items-center justify-center">
              <RoleIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {getRoleLabel(currentUser.role)}
              </h1>
              <p className="text-muted-foreground">
                Welcome back, {currentUser.firstName} {currentUser.lastName}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Role-based Dashboard Content */}
        {currentUser.role === 'client' && (
          <EnhancedClientDashboard userId={currentUser.id} />
        )}

        {currentUser.role === 'pharmacy_seller' && (
          <EnhancedPharmacySellerDashboard userId={currentUser.id} />
        )}

        {currentUser.role === 'pharmacy_owner' && (
          <EnhancedPharmacyOwnerDashboard userId={currentUser.id} />
        )}

        {currentUser.role === 'super_admin' && (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-muted/50 dark:bg-muted/20">
              <TabsTrigger value="overview" className="flex items-center space-x-2 data-[state=active]:bg-background dark:data-[state=active]:bg-background">
                <Activity className="h-4 w-4" />
                <span>{t('dashboard.overview') || 'Overview'}</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center space-x-2 data-[state=active]:bg-background dark:data-[state=active]:bg-background">
                <BarChart3 className="h-4 w-4" />
                <span>{t('dashboard.analytics') || 'Analytics'}</span>
              </TabsTrigger>
              <TabsTrigger value="pharmacies" className="flex items-center space-x-2 data-[state=active]:bg-background dark:data-[state=active]:bg-background">
                <Building className="h-4 w-4" />
                <span>{t('dashboard.pharmacies') || 'Pharmacies'}</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center space-x-2 data-[state=active]:bg-background dark:data-[state=active]:bg-background">
                <Users className="h-4 w-4" />
                <span>{t('dashboard.users') || 'Users'}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <AnalyticsDashboard />
            </TabsContent>

            <TabsContent value="analytics">
              <AnalyticsDashboard />
            </TabsContent>

            <TabsContent value="pharmacies">
              <Card className="bg-card dark:bg-card border-border dark:border-border">
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <Building className="h-16 w-16 text-muted-foreground dark:text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground dark:text-foreground mb-2">
                      {t('dashboard.pharmacy_management') || 'Pharmacy Management'}
                    </h3>
                    <p className="text-muted-foreground dark:text-muted-foreground mb-4">
                      {t('dashboard.pharmacy_desc') || 'Manage registered pharmacies, licenses, and compliance'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card className="bg-card dark:bg-card border-border dark:border-border">
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-muted-foreground dark:text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground dark:text-foreground mb-2">
                      {t('dashboard.user_management') || 'User Management'}
                    </h3>
                    <p className="text-muted-foreground dark:text-muted-foreground mb-4">
                      {t('dashboard.user_desc') || 'Manage system users, roles, and permissions'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
