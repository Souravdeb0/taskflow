import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { startReminderCron } from './services/cronService.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

dotenv.config();

const PORT = process.env.PORT || 5001;
const app = express();

app.use(cors());
app.use(express.json());

// API Base Route
app.get('/api', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to the TaskFlow Server API' });
});

// Mount Route Modules
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api', commentRoutes);

// GLOBAL ERROR MIDDLEWARE
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
});

// SERVER STARTUP
async function startServer() {
  await connectDB();
  startReminderCron();

  app.listen(PORT, () => {
    console.log(`TaskFlow server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer().catch((error) => {
  console.error('Fatal error starting server:', error);
  process.exit(1);
});
