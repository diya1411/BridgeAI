import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import summarizeRouter from './routes/summarize';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('BridgeAI Backend is running!');
});

app.use('/api', summarizeRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
