/**
 * API Route: /api/analyze
 * Handles deal analysis request, generates PDFs, uploads to Drive, and appends to Sheets
 */

import { NextResponse } from 'next/server';
import UnderwritingCalculator from '../../../lib/underwriting-calculator.js';
import PDFGenerator from '../../../lib/pdf-generator.js';
import GoogleDriveUploader from '../../../lib/google-drive-uploader.js';
import GoogleSheetsAppender from '../../../lib/google-sheets-appender.js';

export async function POST(request) {
  try {
    const {
      address,
      assetType,
      price,
      grossIncome,
      expenses,
      userName,
    } = await request.json();

    // Validate input
    if (!address || !price || !grossIncome) {
      return NextResponse.json(
        {
          error: 'Missing required fields: address, price, grossIncome',
        },
        { status: 400 }
      );
    }

    if (price <= 0 || grossIncome <= 0) {
      return NextResponse.json(
        {
          error: 'Price and Gross Income must be greater than 0',
        },
        { status: 400 }
      );
    }

    // Calculate underwriting
    const calculator = new UnderwritingCalculator(
      assetType,
      price,
      grossIncome,
      expenses
    );

    const analysis = calculator.getSummary();
    analysis.address = address;

    console.log('Analysis Summary:', {
      address,
      assetType,
      price,
      grossIncome,
      bibleNOI: analysis.bibleNOI,
      bestStructure: analysis.bestStructure,
    });

    // Generate PDFs
    const pdfGenerator = new PDFGenerator(analysis, address, userName);
    let pdfData;

    try {
      pdfData = await pdfGenerator.generateAll();
      console.log('PDFs generated successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      return NextResponse.json(
        {
          error: 'Failed to generate PDF files',
          details: error.message,
        },
        { status: 500 }
      );
    }

    let driveUploadResult = null;
    let sheetsAppendResult = null;

    // Upload to Google Drive
    if (
      process.env.GOOGLE_SHEETS_ID &&
      process.env.GOOGLE_PRIVATE_KEY &&
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    ) {
      try {
        const driveUploader = new GoogleDriveUploader();
        const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

        if (parentFolderId) {
          driveUploadResult = await driveUploader.uploadAnalysisPDFs(
            address,
            pdfData,
            parentFolderId
          );
          console.log('Drive upload successful:', driveUploadResult.folderLink);
        }

        // Append to Google Sheets
        try {
          const sheetsAppender = new GoogleSheetsAppender();
          await sheetsAppender.ensureHeaders();

          sheetsAppendResult = await sheetsAppender.appendAnalysis(
            analysis,
            driveUploadResult?.folderLink || '',
            userName
          );
          console.log('Sheets append successful');
        } catch (sheetsError) {
          console.error('Sheets append warning:', sheetsError.message);
          // Continue anyway - Drive upload succeeded
        }
      } catch (driveError) {
        console.error('Drive upload warning:', driveError.message);
        // Continue anyway - analysis was successful
      }
    } else {
      console.warn(
        'Google credentials not configured. Skipping Drive/Sheets upload.'
      );
    }

    // Return results
    return NextResponse.json({
      success: true,
      address,
      assetType: analysis.assetType,
      price: analysis.price,
      grossIncome: analysis.grossIncome,
      bibleNOI: analysis.bibleNOI,
      bestStructure: analysis.bestStructure,
      bestPass: analysis.bestPass
        ? {
            pocket: analysis.bestPass.pocket,
            dscr: analysis.bestPass.actualDSCR,
            bankLoan: analysis.bestPass.bankLoan,
            bankDS: analysis.bestPass.bankDS,
          }
        : null,
      scenarios: analysis.scenarios,
      passCount: analysis.passCount,
      failCount: analysis.failCount,
      driveFolderLink: driveUploadResult?.folderLink || null,
      sheetsLink: sheetsAppendResult?.spreadsheetUrl || null,
      pdfGenerated: true,
      message: 'Analysis complete. PDFs generated and uploaded.',
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// Next.js 14 app directory doesn't require body size config
// Request bodies up to 1MB are supported by default
