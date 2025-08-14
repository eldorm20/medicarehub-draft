import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { 
  Store,
  Package,
  Users,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign
} from 'lucide-react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';

interface Medicine {
  id: string;
  name: string;
  manufacturer: string;
  category: string;
  quantity: number;
  minStock: number;
  price: number;
  expiryDate: string;
  batchNumber: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired';
}

interface StaffMember {
  id: string;
  name: string;
  role: 'pharmacist' | 'seller' | 'manager';
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  joinedDate: string;
}

export default function PharmacyManagement() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAddMedicineOpen, setIsAddMedicineOpen] = useState(false);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);

  // Mock data - in production this would come from API
  const [medicines, setMedicines] = useState<Medicine[]>([
    {
      id: '1',
      name: 'Paracetamol 500mg',
      manufacturer: 'PharmaCorp',
      category: 'Pain Relief',
      quantity: 150,
      minStock: 50,
      price: 5000,
      expiryDate: '2025-12-31',
      batchNumber: 'PC240101',
      status: 'in_stock'
    },
    {
      id: '2',
      name: 'Ibuprofen 400mg',
      manufacturer: 'MediLife',
      category: 'Pain Relief',
      quantity: 25,
      minStock: 30,
      price: 8000,
      expiryDate: '2025-06-15',
      batchNumber: 'ML240205',
      status: 'low_stock'
    },
    {
      id: '3',
      name: 'Amoxicillin 250mg',
      manufacturer: 'BioPharm',
      category: 'Antibiotics',
      quantity: 0,
      minStock: 20,
      price: 12000,
      expiryDate: '2024-03-20',
      batchNumber: 'BP230915',
      status: 'out_of_stock'
    }
  ]);

  const [staff, setStaff] = useState<StaffMember[]>([
    {
      id: '1',
      name: 'Akmal Karimov',
      role: 'pharmacist',
      email: 'akmal@pharmacy.uz',
      phone: '+998901234567',
      status: 'active',
      joinedDate: '2023-01-15'
    },
    {
      id: '2',
      name: 'Malika Nazarova',
      role: 'seller',
      email: 'malika@pharmacy.uz',
      phone: '+998901234568',
      status: 'active',
      joinedDate: '2023-03-20'
    }
  ]);

  const [newMedicine, setNewMedicine] = useState({
    name: '',
    manufacturer: '',
    category: '',
    quantity: 0,
    minStock: 0,
    price: 0,
    expiryDate: '',
    batchNumber: ''
  });

  const [newStaff, setNewStaff] = useState({
    name: '',
    role: 'seller' as StaffMember['role'],
    email: '',
    phone: ''
  });

  const categories = ['all', 'Pain Relief', 'Antibiotics', 'Vitamins', 'Cardiovascular', 'Respiratory'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'low_stock':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'out_of_stock':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const handleAddMedicine = () => {
    const medicine: Medicine = {
      id: Date.now().toString(),
      ...newMedicine,
      status: newMedicine.quantity > newMedicine.minStock ? 'in_stock' :
              newMedicine.quantity > 0 ? 'low_stock' : 'out_of_stock'
    };
    
    setMedicines(prev => [...prev, medicine]);
    setNewMedicine({
      name: '',
      manufacturer: '',
      category: '',
      quantity: 0,
      minStock: 0,
      price: 0,
      expiryDate: '',
      batchNumber: ''
    });
    setIsAddMedicineOpen(false);
    
    toast({
      title: 'Success',
      description: 'Medicine added successfully',
    });
  };

  const handleAddStaff = () => {
    const staffMember: StaffMember = {
      id: Date.now().toString(),
      ...newStaff,
      status: 'active',
      joinedDate: new Date().toISOString().split('T')[0]
    };
    
    setStaff(prev => [...prev, staffMember]);
    setNewStaff({
      name: '',
      role: 'seller',
      email: '',
      phone: ''
    });
    setIsAddStaffOpen(false);
    
    toast({
      title: 'Success',
      description: 'Staff member added successfully',
    });
  };

  const handleExportInventory = () => {
    const exportData = medicines.map(medicine => ({
      'Medicine Name': medicine.name,
      'Manufacturer': medicine.manufacturer,
      'Category': medicine.category,
      'Quantity': medicine.quantity,
      'Min Stock': medicine.minStock,
      'Price (UZS)': medicine.price,
      'Expiry Date': medicine.expiryDate,
      'Batch Number': medicine.batchNumber,
      'Status': medicine.status.toUpperCase()
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
    XLSX.writeFile(wb, `inventory_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: 'Success',
      description: 'Inventory exported successfully',
    });
  };

  const filteredMedicines = medicines.filter(medicine => {
    const matchesSearch = medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         medicine.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || medicine.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const inventoryStats = {
    totalItems: medicines.length,
    lowStock: medicines.filter(m => m.status === 'low_stock').length,
    outOfStock: medicines.filter(m => m.status === 'out_of_stock').length,
    totalValue: medicines.reduce((sum, m) => sum + (m.quantity * m.price), 0)
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center">
              <Store className="h-8 w-8 mr-3 text-primary" />
              Pharmacy Management
            </h1>
            <p className="text-muted-foreground">
              Manage your pharmacy inventory, staff, and operations
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Items</p>
                    <p className="text-3xl font-bold text-foreground">{inventoryStats.totalItems}</p>
                  </div>
                  <Package className="h-12 w-12 text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Low Stock</p>
                    <p className="text-3xl font-bold text-amber-600">{inventoryStats.lowStock}</p>
                  </div>
                  <AlertTriangle className="h-12 w-12 text-amber-500 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Out of Stock</p>
                    <p className="text-3xl font-bold text-red-600">{inventoryStats.outOfStock}</p>
                  </div>
                  <Package className="h-12 w-12 text-red-500 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Value</p>
                    <p className="text-3xl font-bold text-green-600">
                      {inventoryStats.totalValue.toLocaleString()} UZS
                    </p>
                  </div>
                  <DollarSign className="h-12 w-12 text-green-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="inventory" className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>Inventory</span>
              </TabsTrigger>
              <TabsTrigger value="staff" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Staff</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Analytics</span>
              </TabsTrigger>
            </TabsList>

            {/* Inventory Management */}
            <TabsContent value="inventory">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Inventory Management</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={handleExportInventory}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <Dialog open={isAddMedicineOpen} onOpenChange={setIsAddMedicineOpen}>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Medicine
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Add New Medicine</DialogTitle>
                            <DialogDescription>
                              Add a new medicine to your inventory
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="name">Medicine Name</Label>
                              <Input
                                id="name"
                                value={newMedicine.name}
                                onChange={(e) => setNewMedicine(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Enter medicine name"
                              />
                            </div>
                            <div>
                              <Label htmlFor="manufacturer">Manufacturer</Label>
                              <Input
                                id="manufacturer"
                                value={newMedicine.manufacturer}
                                onChange={(e) => setNewMedicine(prev => ({ ...prev, manufacturer: e.target.value }))}
                                placeholder="Enter manufacturer"
                              />
                            </div>
                            <div>
                              <Label htmlFor="category">Category</Label>
                              <Select 
                                value={newMedicine.category}
                                onValueChange={(value) => setNewMedicine(prev => ({ ...prev, category: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.slice(1).map(category => (
                                    <SelectItem key={category} value={category}>{category}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="quantity">Quantity</Label>
                                <Input
                                  id="quantity"
                                  type="number"
                                  value={newMedicine.quantity}
                                  onChange={(e) => setNewMedicine(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                                />
                              </div>
                              <div>
                                <Label htmlFor="minStock">Min Stock</Label>
                                <Input
                                  id="minStock"
                                  type="number"
                                  value={newMedicine.minStock}
                                  onChange={(e) => setNewMedicine(prev => ({ ...prev, minStock: parseInt(e.target.value) || 0 }))}
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="price">Price (UZS)</Label>
                              <Input
                                id="price"
                                type="number"
                                value={newMedicine.price}
                                onChange={(e) => setNewMedicine(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="expiryDate">Expiry Date</Label>
                              <Input
                                id="expiryDate"
                                type="date"
                                value={newMedicine.expiryDate}
                                onChange={(e) => setNewMedicine(prev => ({ ...prev, expiryDate: e.target.value }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="batchNumber">Batch Number</Label>
                              <Input
                                id="batchNumber"
                                value={newMedicine.batchNumber}
                                onChange={(e) => setNewMedicine(prev => ({ ...prev, batchNumber: e.target.value }))}
                                placeholder="Enter batch number"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddMedicineOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleAddMedicine}>
                              Add Medicine
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  
                  {/* Search and Filter */}
                  <div className="flex items-center space-x-4 mt-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search medicines..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category === 'all' ? 'All Categories' : category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medicine</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Expiry</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMedicines.map((medicine) => (
                        <TableRow key={medicine.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{medicine.name}</p>
                              <p className="text-sm text-muted-foreground">{medicine.manufacturer}</p>
                            </div>
                          </TableCell>
                          <TableCell>{medicine.category}</TableCell>
                          <TableCell>
                            {medicine.quantity}
                            {medicine.quantity <= medicine.minStock && (
                              <Badge className="ml-2 bg-amber-100 text-amber-800">Low</Badge>
                            )}
                          </TableCell>
                          <TableCell>{medicine.price.toLocaleString()} UZS</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(medicine.status)}>
                              {medicine.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>{medicine.expiryDate}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Medicine</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete {medicine.name}? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => {
                                        setMedicines(prev => prev.filter(m => m.id !== medicine.id));
                                        toast({
                                          title: 'Success',
                                          description: 'Medicine deleted successfully',
                                        });
                                      }}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Staff Management */}
            <TabsContent value="staff">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Staff Management</CardTitle>
                    <Dialog open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Staff
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Add New Staff Member</DialogTitle>
                          <DialogDescription>
                            Add a new staff member to your pharmacy
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="staffName">Full Name</Label>
                            <Input
                              id="staffName"
                              value={newStaff.name}
                              onChange={(e) => setNewStaff(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Enter full name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="role">Role</Label>
                            <Select 
                              value={newStaff.role}
                              onValueChange={(value: StaffMember['role']) => setNewStaff(prev => ({ ...prev, role: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="seller">Seller</SelectItem>
                                <SelectItem value="pharmacist">Pharmacist</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="staffEmail">Email</Label>
                            <Input
                              id="staffEmail"
                              type="email"
                              value={newStaff.email}
                              onChange={(e) => setNewStaff(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="Enter email address"
                            />
                          </div>
                          <div>
                            <Label htmlFor="staffPhone">Phone</Label>
                            <Input
                              id="staffPhone"
                              value={newStaff.phone}
                              onChange={(e) => setNewStaff(prev => ({ ...prev, phone: e.target.value }))}
                              placeholder="Enter phone number"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddStaffOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddStaff}>
                            Add Staff
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staff.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">{member.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {member.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center text-sm">
                                <Mail className="h-3 w-3 mr-1" />
                                {member.email}
                              </div>
                              <div className="flex items-center text-sm">
                                <Phone className="h-3 w-3 mr-1" />
                                {member.phone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              member.status === 'active' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }>
                              {member.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(member.joinedDate).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics */}
            <TabsContent value="analytics">
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Stock Status Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">In Stock</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 h-2 bg-muted rounded-full">
                              <div 
                                className="h-2 bg-green-500 rounded-full"
                                style={{ width: `${(medicines.filter(m => m.status === 'in_stock').length / medicines.length) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">
                              {medicines.filter(m => m.status === 'in_stock').length}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Low Stock</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 h-2 bg-muted rounded-full">
                              <div 
                                className="h-2 bg-amber-500 rounded-full"
                                style={{ width: `${(medicines.filter(m => m.status === 'low_stock').length / medicines.length) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">
                              {medicines.filter(m => m.status === 'low_stock').length}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Out of Stock</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 h-2 bg-muted rounded-full">
                              <div 
                                className="h-2 bg-red-500 rounded-full"
                                style={{ width: `${(medicines.filter(m => m.status === 'out_of_stock').length / medicines.length) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">
                              {medicines.filter(m => m.status === 'out_of_stock').length}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Category Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {categories.slice(1).map(category => {
                          const count = medicines.filter(m => m.category === category).length;
                          const percentage = medicines.length > 0 ? (count / medicines.length) * 100 : 0;
                          return (
                            <div key={category} className="flex items-center justify-between">
                              <span className="text-sm">{category}</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-24 h-2 bg-muted rounded-full">
                                  <div 
                                    className="h-2 bg-primary rounded-full"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium">{count}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm">New medicine added: Paracetamol 500mg</p>
                          <p className="text-xs text-muted-foreground">2 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm">Low stock alert: Ibuprofen 400mg</p>
                          <p className="text-xs text-muted-foreground">4 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm">Staff member added: Malika Nazarova</p>
                          <p className="text-xs text-muted-foreground">1 day ago</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}