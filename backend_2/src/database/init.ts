import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

async function init() {
  const host = process.env.DB_HOST;
  const user = process.env.DB_USERNAME || process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const port = Number(process.env.DB_PORT) || 3306;
  const dbName = process.env.DB_DATABASE || process.env.DB_NAME;

  if (!dbName) {
    console.error('ERROR: DB_NAME is not defined in environment variables');
    process.exit(1);
  }

  console.log(`Connecting to MySQL at ${host}:${port} as ${user}...`);

  try {
    const connection = await mysql.createConnection({
      host,
      user,
      password,
      port,
    });

    console.log(`Ensuring database "${dbName}" exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`Database "${dbName}" checked/created successfully.`);
    
    await connection.end();
    process.exit(0);
  } catch (err: any) {
    console.error('Failed to initialize database:', err.message);
    process.exit(1);
  }
}

init();
