import { Router, Request, Response } from 'express';
import { OpenAI } from 'openai';

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post('/summarize', async (req: Request, res: Response) => {
  const { text, role } = req.body;

  if (!text || !role) {
    return res.status(400).json({ error: 'Missing text or role in request body' });
  }

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that summarizes text for a specific role: ${role}.`,
        },
        { role: 'user', content: text },
      ],
      model: 'gpt-4o-mini',
    });

    const summary = completion.choices[0].message.content;
    res.json({ summary });
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

export default router;
