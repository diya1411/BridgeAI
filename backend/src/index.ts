import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import summarizeRouter from './routes/summarize';
import mongoose from 'mongoose';
import cors from 'cors';


const app = express();
app.use(cors());
const port = process.env.PORT || 3001;

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('FATAL ERROR: MONGODB_URI is not defined.');
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(() => console.log('Successfully connected to MongoDB.'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('BridgeAI Backend is running!');
});

app.use('/api', summarizeRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
