import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests are allowed' });
  }

  const { token } = req.body;

  if (typeof token !== 'string' || token.length === 0) {
    return res.status(400).json({ message: 'Token is required' });
  }

  try {
    await kv.set('lineNotifyToken', token);
    res.status(200).json({ message: 'Token saved successfully' });
  } catch (error) {
    console.error('Failed to save token to Vercel KV:', error);
    res.status(500).json({ message: 'Failed to save token' });
  }
}
