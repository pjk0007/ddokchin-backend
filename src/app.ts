import { Request, Response, NextFunction } from 'express';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const SERVER_SECRET = process.env.SERVER_SECRET;
const app = express();

app.use(cors());
app.use(
  express.text({
    type: 'application/sdp',
  })
);

const DEFAULT_INSTRUCTIONS = `너는 내 친구다`;

app.post('/rtc-connect', async (req, res, next) => {
  try {
    if (req.headers['server-secret'] !== SERVER_SECRET) {
      return next(new Error('Invalid server secret'));
    }

    const body = req.body;

    const url = new URL('https://api.openai.com/v1/realtime');
    url.searchParams.set('model', 'gpt-4o-mini-realtime-preview-2024-12-17');
    url.searchParams.set('instructions', DEFAULT_INSTRUCTIONS);
    url.searchParams.set('voice', 'sage');

    const response = await fetch(url.toString(), {
      method: 'POST',
      body,
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/sdp',
      },
    });

    if (!response.ok) {
      response.json().then(console.log);

      return next(new Error(`OpenAI API error: ${response.status}`));
    }

    const sdp = await response.text();
    res.set('Content-Type', 'application/sdp');
    res.send(sdp);
  } catch (error) {
    next(error);
  }
});

app.get('/healthz', (req, res) => {
  res.send('OK');
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).send(err.message);
});

const PORT = process.env.PORT || 1234;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
