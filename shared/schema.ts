import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum("user_role", [
  "client",
  "pharmacy_seller", 
  "pharmacy_owner",
  "super_admin"
]);

// User storage table (required for auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default("client").notNull(),
  phone: varchar("phone"),
  passwordHash: varchar("password_hash"),
  dateOfBirth: timestamp("date_of_birth"),
  loyaltyPoints: integer("loyalty_points").default(0),
  loyaltyTier: varchar("loyalty_tier").default("bronze"),
  isActive: boolean("is_active").default(true),
  emailVerified: boolean("email_verified").default(false),
  phoneVerified: boolean("phone_verified").default(false),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pharmacies table
export const pharmacies = pgTable("pharmacies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: varchar("city").notNull(),
  phone: varchar("phone"),
  email: varchar("email"),
  licenseNumber: varchar("license_number").notNull(),
  ownerId: varchar("owner_id").references(() => users.id),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Medicines table (from UzPharm registry)
export const medicines = pgTable("medicines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dtRowId: varchar("dt_row_id").unique(),
  blankNum: varchar("blank_num"),
  country: varchar("country"),
  customer: text("customer"),
  manufacturer: text("manufacturer"),
  regNum: varchar("reg_num"),
  series: varchar("series"),
  certDate: varchar("cert_date"),
  certOrg: varchar("cert_org"),
  title: text("title").notNull(),
  title2: text("title_2"),
  year: varchar("year"),
  activeIngredient: text("active_ingredient"),
  dosage: varchar("dosage"),
  form: varchar("form"),
  packaging: varchar("packaging"),
  price: decimal("price", { precision: 10, scale: 2 }),
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pharmacy inventory
export const pharmacyInventory = pgTable("pharmacy_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pharmacyId: varchar("pharmacy_id").references(() => pharmacies.id).notNull(),
  medicineId: varchar("medicine_id").references(() => medicines.id).notNull(),
  quantity: integer("quantity").default(0),
  price: decimal("price", { precision: 10, scale: 2 }),
  expiryDate: timestamp("expiry_date"),
  batchNumber: varchar("batch_number"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Orders
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed", 
  "preparing",
  "ready_for_pickup",
  "out_for_delivery",
  "delivered",
  "cancelled"
]);

export const deliveryMethodEnum = pgEnum("delivery_method", [
  "pickup",
  "yandex_delivery"
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "click",
  "payme",
  "cash"
]);

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  pharmacyId: varchar("pharmacy_id").references(() => pharmacies.id).notNull(),
  orderNumber: varchar("order_number").unique().notNull(),
  status: orderStatusEnum("status").default("pending"),
  deliveryMethod: deliveryMethodEnum("delivery_method").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  deliveryAddress: text("delivery_address"),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default("0"),
  loyaltyPointsUsed: integer("loyalty_points_used").default(0),
  loyaltyPointsEarned: integer("loyalty_points_earned").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order items
export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  medicineId: varchar("medicine_id").references(() => medicines.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Prescriptions
export const prescriptions = pgTable("prescriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  doctorName: varchar("doctor_name"),
  imageUrl: varchar("image_url"),
  analysisResult: jsonb("analysis_result"),
  isVerified: boolean("is_verified").default(false),
  verifiedBy: varchar("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  expiryDate: timestamp("expiry_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI consultations
export const aiConsultations = pgTable("ai_consultations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  sessionId: varchar("session_id"),
  symptoms: text("symptoms"),
  aiResponse: jsonb("ai_response"),
  recommendations: jsonb("recommendations"),
  severity: varchar("severity"),
  followUpRequired: boolean("follow_up_required").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat messages
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  consultationId: varchar("consultation_id").references(() => aiConsultations.id),
  isAi: boolean("is_ai").default(false),
  message: text("message").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Loyalty transactions
export const loyaltyTransactions = pgTable("loyalty_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  orderId: varchar("order_id").references(() => orders.id),
  type: varchar("type").notNull(), // "earned" or "redeemed"
  points: integer("points").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Export types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Insert schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type Medicine = typeof medicines.$inferSelect;
export type InsertMedicine = typeof medicines.$inferInsert;
export type Pharmacy = typeof pharmacies.$inferSelect;
export type InsertPharmacy = typeof pharmacies.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;
export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = typeof prescriptions.$inferInsert;
export type AIConsultation = typeof aiConsultations.$inferSelect;
export type InsertAIConsultation = typeof aiConsultations.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;
export type PharmacyInventory = typeof pharmacyInventory.$inferSelect;
export type InsertPharmacyInventory = typeof pharmacyInventory.$inferInsert;

// Additional Zod schemas

export const insertMedicineSchema = createInsertSchema(medicines);
export const insertOrderSchema = createInsertSchema(orders);
export const insertPrescriptionSchema = createInsertSchema(prescriptions);
export const insertAIConsultationSchema = createInsertSchema(aiConsultations);
