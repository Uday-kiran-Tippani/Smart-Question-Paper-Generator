import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set.");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function clearDB() {
    try {
        console.log("Dropping public schema...");
        await pool.query(`DROP SCHEMA public CASCADE;`);
        console.log("Recreating public schema...");
        await pool.query(`CREATE SCHEMA public;`);
        console.log("Database cleared successfully!");
    } catch (error) {
        console.error("Error clearing database:", error);
    } finally {
        await pool.end();
    }
}

clearDB();
