const { Surreal } = require('surrealdb');
async function run() {
  console.log('Connecting...');
  const db = new Surreal();
  await db.connect('ws://127.0.0.1:8000/rpc');
  console.log('Connected!');
  process.exit(0);
}
run().catch(console.error);
