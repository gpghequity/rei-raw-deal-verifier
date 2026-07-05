/**
 * File Parser
 * Extracts property data from uploaded files (PDF, text, etc.)
 */

import pdfParse from 'pdf-parse';

export class FileParser {
  /**
   * Parse uploaded file (PDF or text)
   */
  async parseFile(fileBuffer, mimeType) {
    try {
      if (mimeType === 'application/pdf') {
        return await this.parsePDF(fileBuffer);
      } else if (
        mimeType === 'text/plain' ||
        mimeType === 'text/csv'
      ) {
        return this.parseText(fileBuffer.toString('utf-8'));
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      return null;
    }
  }

  /**
   * Parse PDF and extract text
   */
  async parsePDF(buffer) {
    try {
      const data = await pdfParse(buffer);
      const text = data.text;
      return this.extractPropertyData(text);
    } catch (error) {
      console.error('Error parsing PDF:', error);
      return null;
    }
  }

  /**
   * Parse text content
   */
  parseText(text) {
    return this.extractPropertyData(text);
  }

  /**
   * Extract property data from text using regex patterns
   */
  extractPropertyData(text) {
    const data = {};

    // Extract address
    const addressMatch = text.match(/address[:\s]+([\w\s,]+)/i);
    if (addressMatch) {
      data.address = addressMatch[1].trim();
    }

    // Extract price
    const priceMatch = text.match(/price[:\s]*\$?([\d,]+)/i);
    if (priceMatch) {
      data.price = parseInt(priceMatch[1].replace(/,/g, ''));
    }

    // Extract gross income
    const incomeMatch = text.match(
      /(?:gross\s+)?income[:\s]*\$?([\d,]+(?:\.\d{2})?)/i
    );
    if (incomeMatch) {
      data.grossIncome = parseFloat(incomeMatch[1].replace(/,/g, ''));
    }

    // Extract expenses
    const expenseMatch = text.match(
      /expenses?[:\s]*\$?([\d,]+(?:\.\d{2})?)/i
    );
    if (expenseMatch) {
      data.expenses = parseFloat(expenseMatch[1].replace(/,/g, ''));
    }

    // Extract asset type
    const assetTypeMatch = text.match(
      /(?:asset\s+type|property\s+type)[:\s]+([\w\s]+)/i
    );
    if (assetTypeMatch) {
      data.assetType = assetTypeMatch[1].trim();
    }

    return Object.keys(data).length > 0 ? data : null;
  }

  /**
   * Validate extracted data has required fields
   */
  validateExtractedData(data) {
    return (
      data &&
      typeof data.price === 'number' &&
      typeof data.grossIncome === 'number' &&
      data.price > 0 &&
      data.grossIncome > 0
    );
  }
}

export default FileParser;
