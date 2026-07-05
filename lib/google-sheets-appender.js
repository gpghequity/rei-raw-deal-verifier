/**
 * Google Sheets Appender
 * Appends analysis results to the Raw Deal Analyses sheet
 */

import { google } from 'googleapis';

export class GoogleSheetsAppender {
  constructor() {
    this.auth = this.getAuth();
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    this.spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  }

  /**
   * Get authenticated Google client
   */
  getAuth() {
    const serviceAccount = {
      type: 'service_account',
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY
        ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined,
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url:
        'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL,
    };

    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    return auth;
  }

  /**
   * Append one row to Raw Deal Analyses sheet
   * Columns: Address, Asset Type, User, Date, Price, GI, Bible NOI, Best Structure, Pocket, Status, Drive Folder Link
   */
  async appendAnalysis(analysisData, driveFolderLink, user = 'Unknown') {
    try {
      const now = new Date().toLocaleDateString('en-US');
      const bestPass = analysisData.bestPass;

      const values = [
        [
          analysisData.address || '',
          analysisData.assetType,
          user,
          now,
          `$${analysisData.price}`,
          `$${analysisData.grossIncome}`,
          `$${Math.round(analysisData.bibleNOI)}`,
          analysisData.bestStructure || 'No Pass',
          bestPass ? `$${Math.round(bestPass.pocket)}` : '$0',
          bestPass ? 'PASS' : 'FAIL',
          driveFolderLink || '',
        ],
      ];

      const request = {
        spreadsheetId: this.spreadsheetId,
        range: 'Raw Deal Analyses!A:K',
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: values,
        },
      };

      const response = await this.sheets.spreadsheets.values.append(request);

      return {
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}`,
        rowsAdded: response.data.updates.updatedRows,
      };
    } catch (error) {
      console.error('Error appending to Google Sheets:', error);
      throw error;
    }
  }

  /**
   * Ensure headers exist in Raw Deal Analyses sheet
   */
  async ensureHeaders() {
    try {
      const headers = [
        'Address',
        'Asset Type',
        'User',
        'Date',
        'Price',
        'Gross Income',
        'Bible NOI',
        'Best Structure',
        'Annual Pocket',
        'Status',
        'Drive Folder Link',
      ];

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Raw Deal Analyses!A1:K1',
      });

      if (!response.data.values || response.data.values[0].length === 0) {
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: 'Raw Deal Analyses!A1:K1',
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [headers],
          },
        });
      }
    } catch (error) {
      console.error('Error ensuring headers:', error);
      throw error;
    }
  }
}

export default GoogleSheetsAppender;
