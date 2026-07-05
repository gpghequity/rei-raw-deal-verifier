import { NextApiRequest, NextApiResponse } from 'next';

interface ParsedData {
  address?: string;
  asking_price?: string;
  gross_income?: string;
  seller_expenses?: string;
  asset_type?: string;
}

function extractNumberFromText(text: string): string {
  const match = text.match(/[\d,\.]+/);
  return match ? match[0].replace(/,/g, '') : '';
}

function parseText(content: string): ParsedData {
  const lines = content.split('\n');
  const result: ParsedData = {};

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Extract Address
    if (!result.address && (lowerLine.includes('address') || lowerLine.includes('street') || lowerLine.includes('property'))) {
      const parts = line.split(':');
      if (parts.length > 1) {
        result.address = parts[1].trim();
      }
    }

    // Extract Asking Price
    if (!result.asking_price && (lowerLine.includes('asking price') || lowerLine.includes('list price') || lowerLine.includes('purchase price'))) {
      result.asking_price = extractNumberFromText(line);
    }

    // Extract Gross Income
    if (!result.gross_income && (lowerLine.includes('gross income') || lowerLine.includes('annual income') || lowerLine.includes('annual revenue') || lowerLine.includes('annual rent'))) {
      result.gross_income = extractNumberFromText(line);
    }

    // Extract Seller Expenses
    if (!result.seller_expenses && (lowerLine.includes('seller expense') || lowerLine.includes('annual expense') || lowerLine.includes('operating expense'))) {
      result.seller_expenses = extractNumberFromText(line);
    }

    // Extract Asset Type
    if (!result.asset_type) {
      if (lowerLine.includes('commercial')) result.asset_type = 'Commercial';
      else if (lowerLine.includes('residential')) result.asset_type = 'Residential';
      else if (lowerLine.includes('storage')) result.asset_type = 'Storage';
      else if (lowerLine.includes('mhp') || lowerLine.includes('mobile home') || lowerLine.includes('manufactured')) result.asset_type = 'MHP';
      else if (lowerLine.includes('rv park')) result.asset_type = 'RV Park';
      else if (lowerLine.includes('mixed-use') || lowerLine.includes('mixed use')) result.asset_type = 'Mixed-Use';
    }
  }

  return result;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, fileContent, fileName } = req.body;

    if (!text && !fileContent) {
      return res.status(400).json({ error: 'No text or file content provided' });
    }

    let content = text || fileContent || '';

    // For text files, it's already plain text
    // For other formats, we'd need additional libraries
    // For now, we'll handle base64 decoded content or plain text

    if (fileContent && !text) {
      try {
        // Try to decode base64
        content = Buffer.from(fileContent, 'base64').toString('utf-8');
      } catch (e) {
        content = fileContent;
      }
    }

    const parsed = parseText(content);

    return res.status(200).json({ success: true, parsed });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', message: String(err) });
  }
}
