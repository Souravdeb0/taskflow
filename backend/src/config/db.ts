import { Surreal, Table, StringRecordId } from 'surrealdb';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.SURREAL_URL || 'ws://127.0.0.1:8000/rpc';
const ns = process.env.SURREAL_NS || 'taskflow';
const dbName = process.env.SURREAL_DB || 'taskflow';
const user = process.env.SURREAL_USER || 'root';
const pass = process.env.SURREAL_PASS || 'root';

export const db = new Surreal();

export async function connectDB() {
  try {
    await db.connect(url);
    await db.signin({ username: user, password: pass });
    await db.use({ namespace: ns, database: dbName });
    console.log(`Connected to SurrealDB at ${url} (NS: ${ns}, DB: ${dbName})`);
  } catch (error) {
    console.error('Failed to connect to SurrealDB:', error);
    process.exit(1);
  }
}

export async function safeQuery(queryStr: string, bindings?: any): Promise<any> {
  try {
    return await db.query(queryStr, bindings);
  } catch (err: any) {
    if (err.kind === 'NotFound' || err.message?.includes('does not exist') || err.message?.includes('NotFound')) {
      return [[]];
    }
    throw err;
  }
}

export async function safeSelect(recordId: StringRecordId | Table<string>): Promise<any> {
  try {
    return await db.select(recordId as any);
  } catch (err: any) {
    if (err.kind === 'NotFound' || err.message?.includes('does not exist') || err.message?.includes('NotFound')) {
      return null;
    }
    throw err;
  }
}

export async function safeMerge(recordId: StringRecordId, data: Record<string, any>): Promise<any> {
  const recStr = recordId.toString();
  const res: any = await db.query(`UPDATE type::record($id) MERGE $data`, { id: recStr, data });
  return Array.isArray(res[0]) ? res[0][0] : res[0];
}
