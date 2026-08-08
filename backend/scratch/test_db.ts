import { Surreal } from 'surrealdb';

async function test() {
  console.log('Testing SurrealDB connection...');
  const db = new Surreal();
  try {
    console.log('Connecting...');
    await db.connect('ws://127.0.0.1:8000/rpc');
    console.log('Connected! Signing in...');
    await db.signin({ username: 'root', password: 'root' });
    console.log('Signed in! Selecting database...');
    await db.use({ namespace: 'taskflow', database: 'taskflow' });
    console.log('Database selected! Selecting users...');
    const users = await db.select('user');
    console.log('Users found:', users);
    console.log('SUCCESS!');
  } catch (err) {
    console.error('ERROR OCCURRED:', err);
  } finally {
    await db.close();
    console.log('Connection closed.');
  }
}

test();
