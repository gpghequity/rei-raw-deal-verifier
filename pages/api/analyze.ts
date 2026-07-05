import { NextApiRequest, NextApiResponse } from 'next';
import { TeamAnalysisGenerator } from '../../lib/team-analysis-generator';
import { PropertyData } from '../../lib/bible-constants';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data: PropertyData = req.body;

    if (!data.address || !data.asking_price || !data.gross_income) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const gen = new TeamAnalysisGenerator(data);
    const result = gen.generate();

    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', message: String(err) });
  }
}
