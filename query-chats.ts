import { connectDB, safeQuery } from './backend/src/config/db.js';
import { StringRecordId } from 'surrealdb';

async function run() {
  console.log("Connecting to DB...");
  await connectDB();
  console.log("Connected. Querying chats...");
  const chats = await safeQuery('SELECT * FROM chat');
  console.log("All chats:", JSON.stringify(chats, null, 2));
  
  const userId = new StringRecordId('user:bob_uid');
  const filtered = await safeQuery('SELECT * FROM chat WHERE created_by = $userId OR $userId IN members', { userId });
  console.log("Filtered for Bob:", JSON.stringify(filtered, null, 2));
  
  process.exit(0);
}
run();
