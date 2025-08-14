export interface Medicine {
  id: string;
  dtRowId?: string;
  blankNum?: string;
  country?: string;
  customer?: string;
  manufacturer?: string;
  regNum?: string;
  series?: string;
  certDate?: string;
  certOrg?: string;
  title: string;
  title2?: string;
  year?: string;
  activeIngredient?: string;
  dosage?: string;
  form?: string;
  packaging?: string;
  price?: number;
  stock?: number;
  isAvailable: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MedicineSearchFilters {
  country?: string;
  year?: string;
  manufacturer?: string;
  limit?: number;
}

export interface CartItem {
  medicine: Medicine;
  quantity: number;
}

export interface PharmacyInventory {
  id: string;
  pharmacyId: string;
  medicineId: string;
  quantity: number;
  price?: number;
  expiryDate?: string;
  batchNumber?: string;
}
