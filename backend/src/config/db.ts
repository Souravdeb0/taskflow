import { Surreal } from 'surrealdb';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.SURREAL_URL || 'ws://127.0.0.1:8000';
const ns = process.env.SURREAL_NS || 'jira_lite';
const dbName = process.env.SURREAL_DB || 'jira_lite';
const user = process.env.SURREAL_USER || 'root';
const pass = process.env.SURREAL_PASS || 'root';

const db = new Surreal();

export async function connectDB() {
  try {
    await db.connect(url);
    await db.use({ namespace: ns, database: dbName });
    await db.signin({ username: user, password: pass });
    console.log(`Connected to SurrealDB at ${url} (NS: ${ns}, DB: ${dbName})`);
  } catch (error) {
    console.error('Failed to connect to SurrealDB:', error);
    process.exit(1);
  }
}

export default db;
