import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create a new Pool instance for the standard 'pg' library
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Use drizzle-orm with the node-postgres driver
export const db = drizzle(pool, { schema });
