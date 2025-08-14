import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { i18n } from '@/lib/i18n';
import { 
  Package, 
  Upload, 
  Download, 
  Plus, 
  Edit, 
  Search, 
  Filter,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Medicine } from '@/types/medicine';

interface InventoryManagerProps {
  pharmacyId?: string;
}

export function InventoryManager({ pharmacyId }: InventoryManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [newStock, setNewStock] = useState(0);
  const [newPrice, setNewPrice] = useState(0);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['/api/inventory', selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      const response = await apiRequest('GET', `/api/inventory?${params}`, {});
      return response.json() as Promise<Medicine[]>;
    }
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ medicineId, quantity, price }: { medicineId: string; quantity: number; price?: number }) => {
      const response = await apiRequest('PUT', `/api/inventory/${medicineId}/stock`, {
        body: JSON.stringify({ quantity, price })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      toast({
        title: i18n.t('common.success'),
        description: 'Stock updated successfully'
      });
      setIsStockDialogOpen(false);
      setSelectedMedicine(null);
    },
    onError: () => {
      toast({
        title: i18n.t('common.error'),
        description: 'Failed to update stock',
        variant: 'destructive'
      });
    }
  });

  const exportInventoryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/inventory/export', {});
      return response;
    },
    onSuccess: async (response) => {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: i18n.t('common.success'),
        description: 'Inventory exported successfully'
      });
    }
  });

  const importInventoryMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('csvFile', file);
      const response = await apiRequest('POST', '/api/inventory/import', {
        body: formData,
        headers: {}
      });
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      toast({
        title: i18n.t('common.success'),
        description: `Imported ${result.imported} medicines. ${result.errors.length} errors.`
      });
      setCsvFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: () => {
      toast({
        title: i18n.t('common.error'),
        description: 'Failed to import inventory',
        variant: 'destructive'
      });
    }
  });

  const handleUpdateStock = () => {
    if (selectedMedicine) {
      updateStockMutation.mutate({
        medicineId: selectedMedicine.id,
        quantity: newStock,
        price: newPrice > 0 ? newPrice : undefined
      });
    }
  };

  const handleImportCSV = () => {
    if (csvFile) {
      importInventoryMutation.mutate(csvFile);
    }
  };

  const filteredInventory = inventory.filter(medicine => {
    const matchesSearch = medicine.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         medicine.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         medicine.activeIngredient?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStockStatus = (medicine: Medicine) => {
    const stock = medicine.stock || 0;
    if (stock === 0) {
      return { status: 'Out of Stock', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: XCircle };
    } else if (stock < 10) {
      return { status: 'Low Stock', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300', icon: AlertTriangle };
    } else {
      return { status: 'In Stock', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: CheckCircle };
    }
  };

  const categories = Array.from(new Set(
    inventory
      .filter(m => m.form)
      .map(m => m.form!)
  ));

  const inventoryStats = {
    total: inventory.length,
    inStock: inventory.filter(m => (m.stock || 0) > 10).length,
    lowStock: inventory.filter(m => (m.stock || 0) > 0 && (m.stock || 0) <= 10).length,
    outOfStock: inventory.filter(m => (m.stock || 0) === 0).length,
    totalValue: inventory.reduce((sum, m) => sum + ((m.price || 0) * (m.stock || 0)), 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center">
            <Package className="h-6 w-6 mr-2 text-primary" />
            {i18n.t('inventory.management')}
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage your pharmacy inventory with real UzPharm medicine data
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => exportInventoryMutation.mutate()}
            disabled={exportInventoryMutation.isPending}
            data-testid="button-export-inventory"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            data-testid="button-select-csv"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          
          {csvFile && (
            <Button
              onClick={handleImportCSV}
              disabled={importInventoryMutation.isPending}
              data-testid="button-import-csv"
            >
              Upload {csvFile.name}
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{inventoryStats.total}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Stock</p>
                <p className="text-2xl font-bold text-green-600">{inventoryStats.inStock}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold text-amber-600">{inventoryStats.lowStock}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{inventoryStats.outOfStock}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-lg font-bold">{inventoryStats.totalValue.toLocaleString()} UZS</p>
              </div>
              <FileSpreadsheet className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search medicines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-medicine"
            />
          </div>
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]" data-testid="select-category">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Medicine Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Form</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filteredInventory.map((medicine) => {
                    const stockInfo = getStockStatus(medicine);
                    const StatusIcon = stockInfo.icon;
                    
                    return (
                      <motion.tr
                        key={medicine.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-b"
                      >
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-medium">{medicine.title}</div>
                            {medicine.activeIngredient && (
                              <div className="text-sm text-muted-foreground">
                                {medicine.activeIngredient}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{medicine.manufacturer}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{medicine.form || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {medicine.stock || 0}
                        </TableCell>
                        <TableCell>
                          {medicine.price ? `${medicine.price.toLocaleString()} UZS` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge className={stockInfo.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {stockInfo.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMedicine(medicine);
                              setNewStock(medicine.stock || 0);
                              setNewPrice(medicine.price || 0);
                              setIsStockDialogOpen(true);
                            }}
                            data-testid={`button-edit-${medicine.id}`}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Stock Update Dialog */}
      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
        <DialogContent data-testid="dialog-update-stock">
          <DialogHeader>
            <DialogTitle>Update Stock & Price</DialogTitle>
          </DialogHeader>
          
          {selectedMedicine && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Medicine</Label>
                <p className="text-sm text-muted-foreground">{selectedMedicine.title}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                    min="0"
                    data-testid="input-new-stock"
                  />
                </div>
                
                <div>
                  <Label htmlFor="price">Price (UZS)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="100"
                    data-testid="input-new-price"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsStockDialogOpen(false)}
                  data-testid="button-cancel-update"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateStock} 
                  disabled={updateStockMutation.isPending}
                  data-testid="button-confirm-update"
                >
                  Update Stock
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}