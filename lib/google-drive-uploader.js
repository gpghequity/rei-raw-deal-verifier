/**
 * Google Drive Uploader
 * Handles PDF uploads to Google Drive folder structure
 */

import { google } from 'googleapis';

export class GoogleDriveUploader {
  constructor() {
    this.auth = this.getAuth();
    this.drive = google.drive({ version: 'v3', auth: this.auth });
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
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    return auth;
  }

  /**
   * Create or get folder for property address
   */
  async getOrCreateAddressFolder(parentFolderId, address) {
    try {
      // Search for existing folder
      const query = `'${parentFolderId}' in parents and name='${address}' and trashed=false and mimeType='application/vnd.google-apps.folder'`;
      const response = await this.drive.files.list({
        q: query,
        spaces: 'drive',
        fields: 'files(id, name)',
        pageSize: 1,
      });

      if (response.data.files.length > 0) {
        return response.data.files[0].id;
      }

      // Create new folder
      const folderMetadata = {
        name: address,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId],
      };

      const createdFolder = await this.drive.files.create({
        resource: folderMetadata,
        fields: 'id',
      });

      return createdFolder.data.id;
    } catch (error) {
      console.error('Error getting/creating address folder:', error);
      throw error;
    }
  }

  /**
   * Upload PDF file to Drive
   */
  async uploadPDF(fileName, pdfBuffer, folderId) {
    try {
      const fileMetadata = {
        name: fileName,
        mimeType: 'application/pdf',
        parents: [folderId],
      };

      const media = {
        mimeType: 'application/pdf',
        body: pdfBuffer instanceof Buffer ? pdfBuffer : Buffer.from(pdfBuffer),
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, webViewLink',
      });

      return {
        fileId: response.data.id,
        fileLink: response.data.webViewLink,
        fileName: fileName,
      };
    } catch (error) {
      console.error(`Error uploading ${fileName}:`, error);
      throw error;
    }
  }

  /**
   * Upload all three PDFs for an analysis
   */
  async uploadAnalysisPDFs(address, pdfData, parentFolderId) {
    try {
      // Create address folder
      const addressFolder = await this.getOrCreateAddressFolder(
        parentFolderId,
        address
      );

      // Upload all three PDFs
      const uploads = await Promise.all([
        this.uploadPDF('Seller Letter.pdf', pdfData.sellerLetter, addressFolder),
        this.uploadPDF(
          'Team Analysis.pdf',
          pdfData.teamAnalysis,
          addressFolder
        ),
        this.uploadPDF(
          'Back Office.pdf',
          pdfData.backOffice,
          addressFolder
        ),
      ]);

      return {
        folderLink: `https://drive.google.com/drive/folders/${addressFolder}`,
        files: uploads,
        addressFolderId: addressFolder,
      };
    } catch (error) {
      console.error('Error uploading analysis PDFs:', error);
      throw error;
    }
  }
}

export default GoogleDriveUploader;
