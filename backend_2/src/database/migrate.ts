import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function runMigration() {
  const host = process.env.DB_HOST;
  const user = process.env.DB_USERNAME || process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const port = Number(process.env.DB_PORT) || 3306;
  const dbName = process.env.DB_DATABASE || process.env.DB_NAME;

  if (!dbName) {
    console.error("ERROR: DB_DATABASE/DB_NAME is not defined");
    process.exit(1);
  }

  console.log(`Running migrations for database: ${dbName}...`);

  try {
    const connection = await mysql.createConnection({
      host,
      user,
      password,
      port,
      database: dbName,
    });

    const db = drizzle(connection);

    // This will run all pending migrations in the specified folder
    await migrate(db, {
      migrationsFolder: path.join(__dirname, "migrations"),
    });

    console.log("Migrations applied successfully!");
    
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
