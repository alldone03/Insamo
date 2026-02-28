import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  schema: "./src/app/models/schema.ts",
  out: "./src/database/migrations",
  dialect: "mysql",
  dbCredentials: {
    host: process.env.DB_HOST!,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USERNAME!,      // ✅ FIX
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_DATABASE!,  // ✅ FIX
  },
});