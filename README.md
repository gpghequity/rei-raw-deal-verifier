# Raw Deal Verifier

Real estate deal analysis tool using Bible v11.24 underwriting standards.

## Features

- Web form for property data entry
- Automated underwriting calculation
- PDF report generation (3 files: Seller Letter, Team Analysis, Back Office)
- Google Drive integration for PDF storage
- Google Sheets integration for analysis logging
- Support for file upload (PDF, TXT, CSV)

## Bible v11.24 Constants

### Residential
- LTV: 80%
- Interest Rate: 7%
- DSCR: 1.25 minimum
- Expense Floor: 15%
- Scenarios: 3 (0%, 15%, 30% pads)

### Commercial
- LTV: 75%
- Interest Rate: 7.25%
- DSCR: 1.25 or 1.15
- Expense Floor: 35%
- Scenarios: 8 (combination of pads and DSCR)

### Equity Structures
- 8% Interest-Only (IO)
- 8% Amortizing
- Seller Finance ($100K @ 8% + $75K @ 5%)

## Setup

### 1. Clone Repository
```bash
git clone https://github.com/gpghequity/rei-raw-deal-verifier.git
cd rei-raw-deal-verifier
npm install
```

### 2. Environment Variables

Create `.env.local`:
```
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_PRIVATE_KEY_ID=your-key-id
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_CERT_URL=your-cert-url
GOOGLE_SHEETS_ID=your-sheets-id
GOOGLE_DRIVE_FOLDER_ID=your-folder-id
```

### 3. Run Locally
```bash
npm run dev
```

Visit `http://localhost:3000`

### 4. Build
```bash
npm run build
npm start
```

## Deployment to Vercel

```bash
vercel deploy --prod
```

URL: https://rei-raw-deal-verifier.vercel.app

## API Endpoint

### POST /api/analyze

Request:
```json
{
  "address": "123 Main St, Lancaster, PA 17601",
  "assetType": "Single Family",
  "price": 250000,
  "grossIncome": 36000,
  "expenses": null,
  "userName": "John Smith"
}
```

Response:
```json
{
  "success": true,
  "address": "123 Main St, Lancaster, PA 17601",
  "assetType": "Single Family",
  "price": 250000,
  "bibleNOI": 30600,
  "bestStructure": "8% IO",
  "bestPass": {
    "pocket": 15600,
    "dscr": 1.25,
    "bankLoan": 200000,
    "bankDS": 16200
  },
  "scenarios": [...],
  "passCount": 3,
  "failCount": 0,
  "driveFolderLink": "https://drive.google.com/drive/folders/...",
  "sheetsLink": "https://docs.google.com/spreadsheets/d/..."
}
```

## PDF Reports

### 1. Seller Letter (1-2 pages)
- Conversational tone
- Property overview
- Recommendation
- Monthly/annual pocket breakdown

### 2. Team Analysis (12 sections)
1. Executive Summary
2. What We Know
3. What We Think
4. What We Need
5. Offer Direction
6. Possible Offer Positions
7. Ceiling Prices
8. Seller vs Bible NOI
9. 8-Scenario Matrix
10. Comparison to Market
11. Diligence Checklist
12. Back Office Notes

### 3. Back Office (6 sections)
1. Assumptions
2. Tier 1 Detail
3. 5-Year Projection
4. Amortization Schedule
5. Cap Sensitivity Analysis
6. Diligence Confidence

## Math Reference

### Bible NOI Calculation
```
Bible NOI = Gross Income - (Gross Income × Expense Floor%)
```

### Bank Loan & Debt Service
```
Bank Loan = Price × LTV
Bank Debt Service = Bank Loan × K Factor
```

### Pocket Calculation
```
Pocket = Bible NOI - Bank DS - Equity Cost
```

## Tech Stack

- **Frontend**: Next.js 14 + React
- **Backend**: Next.js API Routes
- **PDF Generation**: PDFKit
- **Google Integration**: googleapis
- **Styling**: CSS (vanilla)

## License

Proprietary - Good People Good Homes
