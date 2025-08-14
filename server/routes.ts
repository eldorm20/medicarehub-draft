import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { aiService } from "./services/aiService";
import { medicineService } from "./services/medicineService";
import { paymentService } from "./services/paymentService";
import { deliveryService } from "./services/deliveryService";
import { insertOrderSchema, insertPrescriptionSchema, insertAIConsultationSchema } from "@shared/schema";
import { authenticate, authorize, optionalAuth } from "./middleware/auth";
import authRoutes from "./routes/auth";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// File upload configuration
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    cb(null, allowedTypes.includes(file.mimetype));
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Auth routes
  app.use('/api/auth', authRoutes);
  
  // Medicine routes (public access)
  app.get('/api/medicines/search', optionalAuth, async (req, res) => {
    try {
      const { q: query, country, year, manufacturer, limit = 50 } = req.query;
      const filters = { 
        country: country as string, 
        year: year as string, 
        manufacturer: manufacturer as string,
        limit: parseInt(limit as string)
      };
      
      const medicines = await medicineService.searchMedicines(query as string || '', filters);
      res.json(medicines);
    } catch (error) {
      console.error('Medicine search error:', error);
      res.status(500).json({ error: 'Failed to search medicines' });
    }
  });

  app.get('/api/medicines/:id', async (req, res) => {
    try {
      const medicine = await medicineService.getMedicine(req.params.id);
      if (!medicine) {
        return res.status(404).json({ error: 'Medicine not found' });
      }
      res.json(medicine);
    } catch (error) {
      console.error('Get medicine error:', error);
      res.status(500).json({ error: 'Failed to get medicine' });
    }
  });

  app.get('/api/medicines/popular', async (req, res) => {
    try {
      const medicines = await medicineService.getPopularMedicines();
      res.json(medicines);
    } catch (error) {
      console.error('Get popular medicines error:', error);
      res.status(500).json({ error: 'Failed to get popular medicines' });
    }
  });

  // Inventory management routes
  app.get('/api/inventory', authenticate, authorize(['pharmacy_owner', 'pharmacy_seller', 'super_admin']), async (req, res) => {
    try {
      const { category, limit = 100, offset = 0 } = req.query;
      const filters = { 
        category: category as string, 
        limit: parseInt(limit as string), 
        offset: parseInt(offset as string) 
      };
      const medicines = await medicineService.getAllMedicines(filters);
      res.json(medicines);
    } catch (error) {
      console.error('Get inventory error:', error);
      res.status(500).json({ error: 'Failed to get inventory' });
    }
  });

  app.put('/api/inventory/:medicineId/stock', authenticate, authorize(['pharmacy_owner', 'pharmacy_seller']), async (req, res) => {
    try {
      const { medicineId } = req.params;
      const { quantity, price } = req.body;
      
      const updated = await medicineService.updateMedicineStock(medicineId, quantity, price);
      if (!updated) {
        return res.status(404).json({ error: 'Medicine not found' });
      }
      res.json(updated);
    } catch (error) {
      console.error('Update stock error:', error);
      res.status(500).json({ error: 'Failed to update stock' });
    }
  });

  app.get('/api/inventory/export', authenticate, authorize(['pharmacy_owner', 'super_admin']), async (req, res) => {
    try {
      const csvData = await medicineService.exportMedicinesToCSV();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="inventory.csv"');
      res.send(csvData);
    } catch (error) {
      console.error('Export inventory error:', error);
      res.status(500).json({ error: 'Failed to export inventory' });
    }
  });

  app.post('/api/inventory/import', authenticate, authorize(['pharmacy_owner', 'super_admin']), upload.single('csvFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'CSV file is required' });
      }
      
      const csvData = fs.readFileSync(req.file.path, 'utf8');
      const result = await medicineService.importMedicinesFromCSV(csvData);
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      
      res.json(result);
    } catch (error) {
      console.error('Import inventory error:', error);
      res.status(500).json({ error: 'Failed to import inventory' });
    }
  });

  app.post('/api/medicines/import-uzpharm', authenticate, authorize(['super_admin']), async (req, res) => {
    try {
      await medicineService.importUzPharmData();
      res.json({ success: true, message: 'UzPharm data imported successfully' });
    } catch (error) {
      console.error('UzPharm import error:', error);
      res.status(500).json({ error: 'Failed to import UzPharm data' });
    }
  });

  // Test endpoint to import medicine data without authentication
  app.post('/api/test-import-medicines', async (req, res) => {
    try {
      console.log('Starting test medicine import...');
      
      // Import the test medicine data directly
      const fs = await import('fs');
      const path = await import('path');
      
      const testDataPath = path.join(process.cwd(), 'server', 'test_medicines.json');
      
      if (!fs.existsSync(testDataPath)) {
        return res.status(404).json({ error: 'Test medicine data not found' });
      }

      const medicines = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
      console.log(`Importing ${medicines.length} test medicines...`);

      // Clear and import medicines directly into storage
      await storage.insertMedicines(medicines);
      
      console.log(`Successfully imported ${medicines.length} medicines!`);
      res.json({ 
        success: true, 
        message: `Imported ${medicines.length} medicines`,
        sample: medicines[0]?.title || 'No medicines found'
      });
    } catch (error) {
      console.error('Test import error:', error);
      res.status(500).json({ error: 'Failed to import test medicines: ' + error.message });
    }
  });

  // AI consultation routes
  app.post('/api/ai/consult', async (req, res) => {
    try {
      const { symptoms, userId } = req.body;
      if (!symptoms) {
        return res.status(400).json({ error: 'Symptoms are required' });
      }

      const response = await aiService.generateMedicalResponse(symptoms, userId, req.body.language, req.body.prompt);
      res.json(response);
    } catch (error) {
      console.error('AI consultation error:', error);
      res.status(500).json({ error: 'AI consultation failed' });
    }
  });

  app.post('/api/ai/analyze-prescription', upload.single('prescription'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Prescription image is required' });
      }

      // In production, you would use OCR to extract text from image
      // For now, we simulate OCR extraction
      const mockPrescriptionText = `
        Patient: John Doe
        Date: ${new Date().toLocaleDateString()}
        
        Rx:
        1. Paracetamol 500mg - Take 1 tablet every 6 hours for fever/pain
        2. Amoxicillin 500mg - Take 1 capsule 3 times daily for 7 days
        3. Omeprazole 20mg - Take 1 tablet before breakfast
        
        Instructions: Take medications as prescribed. Complete the full course of antibiotics.
        
        Dr. Smith, MD
        License: #123456
      `;
      
      const analysis = await aiService.analyzePrescription(mockPrescriptionText);
      
      // Enhanced response with structured data
      const enhancedAnalysis = {
        success: true,
        prescriptionText: mockPrescriptionText,
        medicines: [
          {
            name: "Paracetamol",
            dosage: "500mg",
            frequency: "Every 6 hours",
            instructions: "For fever/pain",
            available: true,
            interactions: []
          },
          {
            name: "Amoxicillin",
            dosage: "500mg",
            frequency: "3 times daily",
            duration: "7 days",
            instructions: "Complete full course",
            available: true,
            interactions: ["Avoid alcohol"]
          },
          {
            name: "Omeprazole",
            dosage: "20mg",
            frequency: "Once daily",
            instructions: "Before breakfast",
            available: true,
            interactions: []
          }
        ],
        warnings: [
          "Complete the full course of antibiotics",
          "Do not exceed recommended paracetamol dose",
          "Take omeprazole on empty stomach"
        ],
        confidence: 85,
        ...analysis
      };
      
      res.json(enhancedAnalysis);
    } catch (error) {
      console.error('Prescription analysis error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Prescription analysis failed',
        message: 'Unable to analyze prescription at this time. Please try again.' 
      });
    }
  });

  // Prescription routes
  app.post('/api/prescriptions', upload.single('image'), async (req, res) => {
    try {
      const { doctorName, userId } = req.body;
      
      const prescriptionData = {
        userId,
        doctorName,
        imageUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
      };

      const prescription = await storage.createPrescription(prescriptionData);
      res.json(prescription);
    } catch (error) {
      console.error('Create prescription error:', error);
      res.status(500).json({ error: 'Failed to create prescription' });
    }
  });

  app.get('/api/prescriptions/:userId', async (req, res) => {
    try {
      const prescriptions = await storage.getUserPrescriptions(req.params.userId);
      res.json(prescriptions);
    } catch (error) {
      console.error('Get prescriptions error:', error);
      res.status(500).json({ error: 'Failed to get prescriptions' });
    }
  });

  // Order routes (require authentication)
  app.post('/api/orders', authenticate, async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const { items } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({ error: 'Order items are required' });
      }

      // Generate order number
      const orderNumber = `UZ${Date.now()}`;
      const orderWithNumber = { ...orderData, orderNumber };

      const order = await storage.createOrder(orderWithNumber, items);
      res.json(order);
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  });

  app.get('/api/orders/:userId', authenticate, async (req, res) => {
    try {
      const orders = await storage.getUserOrders(req.params.userId);
      res.json(orders);
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({ error: 'Failed to get orders' });
    }
  });

  // Payment routes
  app.post('/api/payments/create', async (req, res) => {
    try {
      const { amount, orderId, userId, method } = req.body;
      
      if (!amount || !orderId || !method) {
        return res.status(400).json({ error: 'Missing required payment fields' });
      }

      const paymentResponse = await paymentService.processPayment({
        amount,
        orderId,
        userId,
        method,
      });

      res.json(paymentResponse);
    } catch (error) {
      console.error('Payment creation error:', error);
      res.status(500).json({ error: 'Failed to create payment' });
    }
  });

  app.post('/api/payments/verify', async (req, res) => {
    try {
      const { transactionId, method } = req.body;
      const isVerified = await paymentService.verifyPayment(transactionId, method);
      res.json({ verified: isVerified });
    } catch (error) {
      console.error('Payment verification error:', error);
      res.status(500).json({ error: 'Failed to verify payment' });
    }
  });

  // Delivery routes
  app.post('/api/delivery/create', async (req, res) => {
    try {
      const { orderId, address, phone, items } = req.body;
      
      const deliveryResponse = await deliveryService.createDelivery({
        orderId,
        address,
        phone,
        items,
      });

      res.json(deliveryResponse);
    } catch (error) {
      console.error('Delivery creation error:', error);
      res.status(500).json({ error: 'Failed to create delivery' });
    }
  });

  app.get('/api/delivery/track/:deliveryId', async (req, res) => {
    try {
      const tracking = await deliveryService.trackDelivery(req.params.deliveryId);
      res.json(tracking);
    } catch (error) {
      console.error('Delivery tracking error:', error);
      res.status(500).json({ error: 'Failed to track delivery' });
    }
  });

  app.get('/api/delivery/slots', async (req, res) => {
    try {
      const slots = await deliveryService.getAvailableSlots();
      res.json({ slots });
    } catch (error) {
      console.error('Get delivery slots error:', error);
      res.status(500).json({ error: 'Failed to get delivery slots' });
    }
  });

  // Pharmacy routes
  app.get('/api/pharmacies', async (req, res) => {
    try {
      const pharmacies = await storage.getPharmacies();
      res.json(pharmacies);
    } catch (error) {
      console.error('Get pharmacies error:', error);
      res.status(500).json({ error: 'Failed to get pharmacies' });
    }
  });

  // Analytics routes (require admin access)
  app.get('/api/analytics', authenticate, authorize('pharmacy_owner', 'super_admin'), async (req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error('Get analytics error:', error);
      res.status(500).json({ error: 'Failed to get analytics' });
    }
  });

  // Data import route (admin only)
  app.post('/api/admin/import-medicines', authenticate, authorize('super_admin'), async (req, res) => {
    try {
      await medicineService.importUzPharmData();
      res.json({ message: 'Medicines imported successfully' });
    } catch (error) {
      console.error('Import medicines error:', error);
      res.status(500).json({ error: 'Failed to import medicines' });
    }
  });

  // Payment integration endpoints (prepared for Click, Payme, Yandex)
  app.post('/api/payments/click/prepare', async (req, res) => {
    try {
      const result = await paymentService.processClickPayment(req.body);
      res.json(result);
    } catch (error) {
      console.error('Click payment error:', error);
      res.status(500).json({ error: 'Payment processing failed' });
    }
  });

  app.post('/api/payments/payme', async (req, res) => {
    try {
      const result = await paymentService.processPaymePayment(req.body);
      res.json(result);
    } catch (error) {
      console.error('Payme payment error:', error);
      res.status(500).json({ error: 'Payment processing failed' });
    }
  });

  app.post('/api/delivery/yandex/create', async (req, res) => {
    try {
      const result = await paymentService.createYandexDelivery(req.body);
      res.json(result);
    } catch (error) {
      console.error('Yandex delivery error:', error);
      res.status(500).json({ error: 'Delivery creation failed' });
    }
  });

  app.get('/api/delivery/yandex/track/:claimId', async (req, res) => {
    try {
      const result = await paymentService.trackYandexDelivery(req.params.claimId);
      res.json(result);
    } catch (error) {
      console.error('Yandex tracking error:', error);
      res.status(500).json({ error: 'Delivery tracking failed' });
    }
  });

  // Serve uploaded files with security headers
  app.use('/uploads', (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  }, express.static('uploads'));

  const httpServer = createServer(app);
  return httpServer;
}
