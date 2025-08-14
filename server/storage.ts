import {
  users,
  medicines,
  pharmacies,
  orders,
  orderItems,
  prescriptions,
  aiConsultations,
  chatMessages,
  pharmacyInventory,
  loyaltyTransactions,
  type User,
  type UpsertUser,
  type Medicine,
  type InsertMedicine,
  type Pharmacy,
  type Order,
  type InsertOrder,
  type Prescription,
  type InsertPrescription,
  type AIConsultation,
  type InsertAIConsultation,
  type ChatMessage,
  type InsertChatMessage,
  type PharmacyInventory,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, like, desc, sql, ilike } from "drizzle-orm";

export interface IStorage {
  // User operations (required for auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByEmailOrPhone(emailOrPhone: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserPassword(userId: string, passwordHash: string): Promise<void>;
  updateUserLastLogin(userId: string): Promise<void>;

  // Medicine operations
  searchMedicines(query: string, filters?: any): Promise<Medicine[]>;
  getMedicine(id: string): Promise<Medicine | undefined>;
  getMedicinesByIds(ids: string[]): Promise<Medicine[]>;
  insertMedicines(medicines: InsertMedicine[]): Promise<void>;

  // Pharmacy operations
  getPharmacies(): Promise<Pharmacy[]>;
  getPharmacyInventory(pharmacyId: string): Promise<PharmacyInventory[]>;

  // Order operations
  createOrder(order: InsertOrder, items: any[]): Promise<Order>;
  getUserOrders(userId: string): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;

  // Prescription operations
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  getUserPrescriptions(userId: string): Promise<Prescription[]>;

  // AI consultation operations
  createAIConsultation(consultation: InsertAIConsultation): Promise<AIConsultation>;
  addChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getConsultationMessages(consultationId: string): Promise<ChatMessage[]>;

  // Analytics
  getAnalytics(): Promise<any>;
}

// In-memory storage implementation for testing without database
export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private usersByEmail: Map<string, User> = new Map();
  private usersByPhone: Map<string, User> = new Map();
  private medicines: Medicine[] = [];
  private orders: Order[] = [];
  private prescriptions: Prescription[] = [];
  private consultations: AIConsultation[] = [];
  private messages: ChatMessage[] = [];

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.usersByEmail.get(email);
  }

  async getUserByEmailOrPhone(emailOrPhone: string): Promise<User | undefined> {
    const isEmail = emailOrPhone.includes('@');
    if (isEmail) {
      return this.usersByEmail.get(emailOrPhone);
    } else {
      return this.usersByPhone.get(emailOrPhone);
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const id = userData.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const user: User = {
      id,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      role: userData.role || 'client',
      phone: userData.phone || null,
      passwordHash: userData.passwordHash || null,
      dateOfBirth: userData.dateOfBirth || null,
      loyaltyPoints: userData.loyaltyPoints || 0,
      loyaltyTier: userData.loyaltyTier || 'bronze',
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      emailVerified: userData.emailVerified || false,
      phoneVerified: userData.phoneVerified || false,
      lastLoginAt: userData.lastLoginAt || null,
      createdAt: userData.createdAt || new Date(),
      updatedAt: new Date(),
    };

    this.users.set(id, user);
    if (user.email) this.usersByEmail.set(user.email, user);
    if (user.phone) this.usersByPhone.set(user.phone, user);
    
    return user;
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.passwordHash = passwordHash;
      user.updatedAt = new Date();
      this.users.set(userId, user);
      if (user.email) this.usersByEmail.set(user.email, user);
      if (user.phone) this.usersByPhone.set(user.phone, user);
    }
  }

  async updateUserLastLogin(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.lastLoginAt = new Date();
      user.updatedAt = new Date();
      this.users.set(userId, user);
      if (user.email) this.usersByEmail.set(user.email, user);
      if (user.phone) this.usersByPhone.set(user.phone, user);
    }
  }

  // Medicine operations (existing)
  async searchMedicines(query: string, filters: any = {}): Promise<Medicine[]> {
    return this.medicines.filter(med => 
      med.title?.toLowerCase().includes(query.toLowerCase()) ||
      med.manufacturer?.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 50);
  }

  async getMedicine(id: string): Promise<Medicine | undefined> {
    return this.medicines.find(med => med.id === id);
  }

  async getMedicinesByIds(ids: string[]): Promise<Medicine[]> {
    return this.medicines.filter(med => ids.includes(med.id));
  }

  async insertMedicines(medicineData: InsertMedicine[]): Promise<void> {
    medicineData.forEach(data => {
      const medicine: Medicine = {
        id: data.id || `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        dtRowId: data.dtRowId || null,
        blankNum: data.blankNum || null,
        country: data.country || null,
        customer: data.customer || null,
        manufacturer: data.manufacturer || null,
        regNum: data.regNum || null,
        series: data.series || null,
        certDate: data.certDate || null,
        certOrg: data.certOrg || null,
        title: data.title,
        title2: data.title2 || null,
        year: data.year || null,
        activeIngredient: data.activeIngredient || null,
        dosage: data.dosage || null,
        form: data.form || null,
        packaging: data.packaging || null,
        price: data.price || null,
        isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
        createdAt: data.createdAt || new Date(),
        updatedAt: data.updatedAt || new Date(),
      };
      this.medicines.push(medicine);
    });
  }

  // Other operations (simplified for testing)
  async getPharmacies(): Promise<Pharmacy[]> {
    return [];
  }

  async getPharmacyInventory(pharmacyId: string): Promise<PharmacyInventory[]> {
    return [];
  }

  async createOrder(orderData: InsertOrder, items: any[]): Promise<Order> {
    const order: Order = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: orderData.userId,
      pharmacyId: orderData.pharmacyId,
      orderNumber: orderData.orderNumber,
      status: orderData.status || 'pending',
      deliveryMethod: orderData.deliveryMethod,
      paymentMethod: orderData.paymentMethod,
      totalAmount: orderData.totalAmount,
      deliveryAddress: orderData.deliveryAddress || null,
      deliveryFee: orderData.deliveryFee || null,
      loyaltyPointsUsed: orderData.loyaltyPointsUsed || 0,
      loyaltyPointsEarned: orderData.loyaltyPointsEarned || 0,
      notes: orderData.notes || null,
      createdAt: orderData.createdAt || new Date(),
      updatedAt: orderData.updatedAt || new Date(),
    };
    this.orders.push(order);
    return order;
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return this.orders.filter(order => order.userId === userId);
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.find(order => order.id === id);
  }

  async createPrescription(prescriptionData: InsertPrescription): Promise<Prescription> {
    const prescription: Prescription = {
      id: `presc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: prescriptionData.userId,
      doctorName: prescriptionData.doctorName || null,
      imageUrl: prescriptionData.imageUrl || null,
      analysisResult: prescriptionData.analysisResult || null,
      isVerified: prescriptionData.isVerified || false,
      verifiedBy: prescriptionData.verifiedBy || null,
      verifiedAt: prescriptionData.verifiedAt || null,
      expiryDate: prescriptionData.expiryDate || null,
      createdAt: prescriptionData.createdAt || new Date(),
      updatedAt: prescriptionData.updatedAt || new Date(),
    };
    this.prescriptions.push(prescription);
    return prescription;
  }

  async getUserPrescriptions(userId: string): Promise<Prescription[]> {
    return this.prescriptions.filter(presc => presc.userId === userId);
  }

  async createAIConsultation(consultationData: InsertAIConsultation): Promise<AIConsultation> {
    const consultation: AIConsultation = {
      id: `consult_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: consultationData.userId || '',
      sessionId: consultationData.sessionId || '',
      symptoms: consultationData.symptoms || '',
      aiResponse: consultationData.aiResponse || {},
      recommendations: consultationData.recommendations || {},
      severity: consultationData.severity || '',
      followUpRequired: consultationData.followUpRequired || false,
      createdAt: new Date(),
    };
    this.consultations.push(consultation);
    return consultation;
  }

  async addChatMessage(messageData: InsertChatMessage): Promise<ChatMessage> {
    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      consultationId: messageData.consultationId || '',
      isAi: messageData.isAi || false,
      message: messageData.message || '',
      metadata: messageData.metadata || {},
      createdAt: new Date(),
    };
    this.messages.push(message);
    return message;
  }

  async getConsultationMessages(consultationId: string): Promise<ChatMessage[]> {
    return this.messages.filter(msg => msg.consultationId === consultationId);
  }

  async getAnalytics(): Promise<any> {
    return {
      revenue: this.orders.reduce((sum, order) => sum + order.totalAmount, 0),
      orders: this.orders.length,
      pharmacies: 0,
      consultations: this.consultations.length,
    };
  }
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByEmailOrPhone(emailOrPhone: string): Promise<User | undefined> {
    const isEmail = emailOrPhone.includes('@');
    const [user] = await db.select().from(users).where(
      isEmail ? eq(users.email, emailOrPhone) : eq(users.phone, emailOrPhone)
    );
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    await db.update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  // Medicine operations
  async searchMedicines(query: string, filters: any = {}): Promise<Medicine[]> {
    const conditions = [];

    if (query) {
      conditions.push(
        sql`${medicines.title} ILIKE ${`%${query}%`} OR ${medicines.manufacturer} ILIKE ${`%${query}%`} OR ${medicines.activeIngredient} ILIKE ${`%${query}%`}`
      );
    }

    if (filters.country) {
      conditions.push(eq(medicines.country, filters.country));
    }

    if (filters.year) {
      conditions.push(eq(medicines.year, filters.year));
    }

    if (filters.manufacturer) {
      conditions.push(ilike(medicines.manufacturer, `%${filters.manufacturer}%`));
    }

    if (conditions.length === 0) {
      return await db.select().from(medicines).limit(50);
    }

    return await db.select().from(medicines).where(and(...conditions)).limit(50);
  }

  async getMedicine(id: string): Promise<Medicine | undefined> {
    const [medicine] = await db.select().from(medicines).where(eq(medicines.id, id));
    return medicine;
  }

  async getMedicinesByIds(ids: string[]): Promise<Medicine[]> {
    return await db.select().from(medicines).where(sql`${medicines.id} = ANY(${ids})`);
  }

  async insertMedicines(medicineData: InsertMedicine[]): Promise<void> {
    if (medicineData.length === 0) return;
    
    // Insert in batches to avoid memory issues
    const batchSize = 1000;
    for (let i = 0; i < medicineData.length; i += batchSize) {
      const batch = medicineData.slice(i, i + batchSize);
      await db.insert(medicines).values(batch).onConflictDoNothing();
    }
  }

  // Pharmacy operations
  async getPharmacies(): Promise<Pharmacy[]> {
    return await db.select().from(pharmacies).where(eq(pharmacies.isActive, true));
  }

  async getPharmacyInventory(pharmacyId: string): Promise<PharmacyInventory[]> {
    return await db.select().from(pharmacyInventory).where(eq(pharmacyInventory.pharmacyId, pharmacyId));
  }

  // Order operations
  async createOrder(orderData: InsertOrder, items: any[]): Promise<Order> {
    const [order] = await db.insert(orders).values(orderData).returning();
    
    const orderItemsData = items.map(item => ({
      orderId: order.id,
      medicineId: item.medicineId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    }));

    await db.insert(orderItems).values(orderItemsData);
    return order;
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  // Prescription operations
  async createPrescription(prescriptionData: InsertPrescription): Promise<Prescription> {
    const [prescription] = await db.insert(prescriptions).values(prescriptionData).returning();
    return prescription;
  }

  async getUserPrescriptions(userId: string): Promise<Prescription[]> {
    return await db.select().from(prescriptions).where(eq(prescriptions.userId, userId)).orderBy(desc(prescriptions.createdAt));
  }

  // AI consultation operations
  async createAIConsultation(consultationData: InsertAIConsultation): Promise<AIConsultation> {
    const [consultation] = await db.insert(aiConsultations).values(consultationData).returning();
    return consultation;
  }

  async addChatMessage(messageData: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values(messageData).returning();
    return message;
  }

  async getConsultationMessages(consultationId: string): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages).where(eq(chatMessages.consultationId, consultationId)).orderBy(chatMessages.createdAt);
  }

  // Analytics
  async getAnalytics(): Promise<any> {
    const totalRevenue = await db.select({ 
      total: sql<number>`SUM(${orders.totalAmount})` 
    }).from(orders);
    
    const totalOrders = await db.select({ 
      count: sql<number>`COUNT(*)` 
    }).from(orders);
    
    const totalPharmacies = await db.select({ 
      count: sql<number>`COUNT(*)` 
    }).from(pharmacies).where(eq(pharmacies.isActive, true));
    
    const totalConsultations = await db.select({ 
      count: sql<number>`COUNT(*)` 
    }).from(aiConsultations);

    return {
      revenue: totalRevenue[0]?.total || 0,
      orders: totalOrders[0]?.count || 0,
      pharmacies: totalPharmacies[0]?.count || 0,
      consultations: totalConsultations[0]?.count || 0,
    };
  }
}

// Use in-memory storage for now until database is set up
export const storage = new MemStorage();
