/**
 * PDF Generator
 * Generates three PDF files:
 * 1. Seller Letter (1-2 pages, conversational)
 * 2. Team Analysis (12 sections)
 * 3. Back Office (6 sections)
 */

import PDFDocument from 'pdfkit';
import { writeFileSync, createWriteStream } from 'fs';
import { Readable } from 'stream';
import path from 'path';
import BIBLE from './bible-constants.js';

export class PDFGenerator {
  constructor(analysis, address, user = 'Unknown') {
    this.analysis = analysis;
    this.address = address;
    this.user = user;
    this.date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    this.now = new Date();
  }

  /**
   * Generate all three PDFs and return as buffers
   */
  async generateAll() {
    const sellerLetter = await this.generateSellerLetter();
    const teamAnalysis = await this.generateTeamAnalysis();
    const backOffice = await this.generateBackOffice();

    return {
      sellerLetter,
      teamAnalysis,
      backOffice,
    };
  }

  /**
   * Seller Letter PDF (1-2 pages, conversational)
   */
  async generateSellerLetter() {
    return new Promise((resolve) => {
      const buffers = [];
      const doc = new PDFDocument({ size: 'Letter' });

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('Offer Analysis', 50, 50);
      doc.fontSize(10)
        .font('Helvetica')
        .text(`${this.date} | Prepared by: ${this.user}`, 50, 80);

      doc.moveTo(50, 95).lineTo(550, 95).stroke();

      // Property Section
      doc.fontSize(14).font('Helvetica-Bold').text('Property Overview', 50, 110);
      doc.fontSize(11).font('Helvetica');

      const data = this.analysis;
      const y1 = 130;
      doc.text(`Address: ${this.address}`, 50, y1);
      doc.text(`Asset Type: ${data.assetType}`, 50, y1 + 18);
      doc.text(
        `Purchase Price: $${this.formatCurrency(data.price)}`,
        50,
        y1 + 36
      );
      doc.text(
        `Annual Gross Income: $${this.formatCurrency(data.grossIncome)}`,
        50,
        y1 + 54
      );
      doc.text(
        `Bible NOI (@ ${data.expensesPercentage.toFixed(0)}% expense floor): $${this.formatCurrency(data.bibleNOI)}`,
        50,
        y1 + 72
      );

      // Offer Analysis Section
      const y2 = y1 + 110;
      doc.fontSize(14).font('Helvetica-Bold').text('Our Recommendation', 50, y2);

      const bestPass = data.bestPass;
      if (bestPass) {
        doc.fontSize(11).font('Helvetica');
        doc.text(
          `Best Structure: ${bestPass.structure} (DSCR: ${bestPass.actualDSCR.toFixed(2)})`,
          50,
          y2 + 25
        );
        doc.text(
          `Your Monthly Pocket: $${this.formatCurrency(bestPass.pocket / 12)}`,
          50,
          y2 + 43
        );
        doc.text(
          `Annual Pocket: $${this.formatCurrency(bestPass.pocket)}`,
          50,
          y2 + 61
        );

        // Convert NOI to monthly
        const monthlyNOI = bestPass.noi / 12;
        const monthlyDS = bestPass.totalDS / 12;
        const monthlyPocket = bestPass.pocket / 12;

        doc.text('', 50, y2 + 82);
        doc.fontSize(10).font('Helvetica-Bold').text('Monthly Breakdown:', 50, y2 + 100);
        doc.fontSize(10).font('Helvetica');
        doc.text(`  NOI: $${this.formatCurrency(monthlyNOI)}`, 70, y2 + 118);
        doc.text(`  Less Debt Service: $${this.formatCurrency(monthlyDS)}`, 70, y2 + 135);
        doc.text(
          `  Your Pocket: $${this.formatCurrency(monthlyPocket)}`,
          70,
          y2 + 152
        );
      } else {
        doc.fontSize(11).font('Helvetica');
        doc.text('No scenarios meet lending criteria at this price.', 50, y2 + 25);
        doc.text('Consider negotiating the purchase price down.', 50, y2 + 43);
      }

      // Footer
      doc.fontSize(9).font('Helvetica').text(
        'This analysis is for internal evaluation only. Not for use in lending decisions.',
        50,
        doc.page.height - 50,
        { align: 'center' }
      );

      doc.end();
    });
  }

  /**
   * Team Analysis PDF (12 sections)
   */
  async generateTeamAnalysis() {
    return new Promise((resolve) => {
      const buffers = [];
      const doc = new PDFDocument({
        size: 'Letter',
        margin: 40,
        bufferPages: true,
      });

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const data = this.analysis;
      let yPos = 50;

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('Raw Deal Analysis Report', 50, 50);
      doc.fontSize(10)
        .font('Helvetica')
        .text(`${this.address} | ${this.date}`, 50, 75);

      yPos = 100;

      // 1. Executive Summary
      yPos = this.addSection(
        doc,
        yPos,
        '1. Executive Summary',
        `Property: ${this.address}\nAsset Type: ${data.assetType}\nPrice: $${this.formatCurrency(data.price)}\nBible NOI: $${this.formatCurrency(data.bibleNOI)}\nRecommended Structure: ${data.bestStructure}\nAnnual Pocket: $${this.formatCurrency(data.bestPass?.pocket || 0)}`
      );

      // 2. What We Know
      yPos = this.addSection(
        doc,
        yPos,
        '2. What We Know',
        `Purchase Price: $${this.formatCurrency(data.price)}\nGross Annual Income: $${this.formatCurrency(data.grossIncome)}\nImputed Expenses (${data.expensesPercentage.toFixed(0)}%): $${this.formatCurrency(data.grossIncome * (data.expensesPercentage / 100))}\nCalculated Bible NOI: $${this.formatCurrency(data.bibleNOI)}`
      );

      // 3. What We Think
      const passCount = data.scenarios.filter((s) => s.passes).length;
      const failCount = data.scenarios.filter((s) => !s.passes).length;
      yPos = this.addSection(
        doc,
        yPos,
        '3. What We Think',
        `Scenarios Passing Lending Criteria: ${passCount} of ${data.scenarios.length}\nScenarios Failing: ${failCount}\nMost Likely Structure: ${data.bestStructure}\nEstimated Monthly Profit: $${this.formatCurrency((data.bestPass?.pocket || 0) / 12)}`
      );

      // 4. What We Need
      yPos = this.addSection(
        doc,
        yPos,
        '4. What We Need',
        `• Verified lease agreements or rental market data\n• Current property condition assessment\n• Property tax and insurance estimates\n• Utility cost history\n• Tenant/buyer creditworthiness documentation`
      );

      // 5. Offer Direction
      const offerPrice =
        data.bestPass?.bankLoan /
        (this.analysis.isCommercial
          ? BIBLE.COMMERCIAL.LTV
          : BIBLE.RESIDENTIAL.LTV) || data.price;
      yPos = this.addSection(
        doc,
        yPos,
        '5. Offer Direction',
        `Recommended Offer: $${this.formatCurrency(Math.round(offerPrice))}\nRationale: Achieves target debt service and acceptable cash flow\nStructure: ${data.bestStructure}\nDSCR: ${data.bestPass?.actualDSCR.toFixed(2) || 'N/A'}`
      );

      // 6. Possible Offer Positions
      let positionsText = '';
      data.scenarios
        .filter((s) => !s.passes)
        .slice(0, 3)
        .forEach((s) => {
          const ceiling = this.calculateCeilingPrice(10000, s.dscr);
          positionsText += `• ${s.name}: Offer $${this.formatCurrency(ceiling)} if ${s.structure} required\n`;
        });
      yPos = this.addSection(
        doc,
        yPos,
        '6. Possible Offer Positions',
        positionsText || 'All scenarios pass at current price.'
      );

      // 7. Ceiling Prices
      let ceilingText =
        'Target Pockets:\n  $25K Pocket | $10K Pocket | Breakeven\n';
      ['No Equity', '8% IO', '8% Amortizing'].forEach((struct) => {
        const p25 = this.calculateCeilingPrice(25000, 1.25, struct);
        const p10 = this.calculateCeilingPrice(10000, 1.25, struct);
        const p0 = this.calculateCeilingPrice(0, 1.25, struct);
        ceilingText += `${struct}: $${this.formatCurrency(p25)} | $${this.formatCurrency(p10)} | $${this.formatCurrency(p0)}\n`;
      });
      yPos = this.addSection(doc, yPos, '7. Ceiling Prices', ceilingText);

      // 8. Seller vs Bible NOI
      yPos = this.addSection(
        doc,
        yPos,
        '8. Seller vs Bible NOI',
        `Bible NOI (our calculation): $${this.formatCurrency(data.bibleNOI)}\nSeller Reported NOI: [Not provided]\nDifference: [Pending seller documentation]`
      );

      // 9. 8-Scenario Matrix
      yPos = this.addScenarioMatrix(doc, yPos, data.scenarios);

      // 10. Comparison to Market
      yPos = this.addSection(
        doc,
        yPos,
        '10. Comparison to Market',
        `Cap Rate (Bible NOI / Price): ${((data.bibleNOI / data.price) * 100).toFixed(2)}%\nMarket Comparable Cap: [Pending market data]\nDebt Service Coverage: ${data.bestPass?.actualDSCR.toFixed(2) || 'N/A'} (Target: 1.25+)`
      );

      // 11. Diligence Checklist
      yPos = this.addSection(
        doc,
        yPos,
        '11. Diligence Checklist',
        `☐ Verify property income (12 months)\n☐ Confirm operating expenses\n☐ Title search and insurance quote\n☐ Property condition inspection\n☐ Environmental screening\n☐ Tenant/buyer background checks\n☐ Lease or purchase agreement review\n☐ Lender pre-qualification`
      );

      // 12. Back Office Notes
      yPos = this.addSection(
        doc,
        yPos,
        '12. Back Office Notes',
        `Analysis Date: ${this.date}\nAnalyst: ${this.user}\nBible Version: v11.24\nNext Steps: Pending team review and seller negotiation`
      );

      // Page numbers
      const pages = doc.bufferedPageRange().count;
      for (let i = 0; i < pages; i++) {
        doc.switchToPage(i);
        doc.fontSize(9).font('Helvetica').text(
          `Page ${i + 1} of ${pages}`,
          50,
          doc.page.height - 30,
          { align: 'right' }
        );
      }

      doc.end();
    });
  }

  /**
   * Back Office PDF (6 sections)
   */
  async generateBackOffice() {
    return new Promise((resolve) => {
      const buffers = [];
      const doc = new PDFDocument({
        size: 'Letter',
        margin: 40,
        bufferPages: true,
      });

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const data = this.analysis;
      let yPos = 50;

      // Header
      doc.fontSize(18).font('Helvetica-Bold').text('Back Office Detail Report', 50, 50);
      doc.fontSize(10)
        .font('Helvetica')
        .text(`${this.address} | ${this.date}`, 50, 75);

      yPos = 100;

      // 1. Assumptions
      const expenseFloor = data.expensesPercentage / 100;
      yPos = this.addSection(
        doc,
        yPos,
        '1. Assumptions',
        `Purchase Price: $${this.formatCurrency(data.price)}\nGross Annual Income: $${this.formatCurrency(data.grossIncome)}\nExpense Floor: ${data.expensesPercentage.toFixed(0)}%\nCalculated Annual Expenses: $${this.formatCurrency(data.grossIncome * expenseFloor)}\nBible NOI: $${this.formatCurrency(data.bibleNOI)}\nLoan-to-Value (LTV): ${(data.isCommercial ? BIBLE.COMMERCIAL.LTV : BIBLE.RESIDENTIAL.LTV) * 100}%\nInterest Rate: ${(data.isCommercial ? BIBLE.COMMERCIAL.RATE : BIBLE.RESIDENTIAL.RATE) * 100}%`
      );

      // 2. Tier 1 Detail
      const bestScenario = data.bestPass;
      if (bestScenario) {
        const ds1 = bestScenario.bankDS / 12;
        const p1 = bestScenario.pocket / 12;
        yPos = this.addSection(
          doc,
          yPos,
          '2. Tier 1 Detail',
          `Bank Loan Amount: $${this.formatCurrency(bestScenario.bankLoan)}\nBank Debt Service (Annual): $${this.formatCurrency(bestScenario.bankDS)}\nBank Debt Service (Monthly): $${this.formatCurrency(ds1)}\nBible NOI (Annual): $${this.formatCurrency(bestScenario.noi)}\nEquity Investment: $${this.formatCurrency(data.price - bestScenario.bankLoan)}\nEquity Cost Structure: ${bestScenario.structure}\nEquity Annual Cost: $${this.formatCurrency(bestScenario.equityCost)}\nTotal Annual Debt Service: $${this.formatCurrency(bestScenario.totalDS)}\nMonthly Pocket: $${this.formatCurrency(p1)}\nAnnual Pocket: $${this.formatCurrency(bestScenario.pocket)}`
        );
      }

      // 3. 5-Year Projection
      yPos = this.addSection(
        doc,
        yPos,
        '3. 5-Year Projection',
        `Year 1 NOI: $${this.formatCurrency(data.bibleNOI)}\nYear 2 NOI (3% growth): $${this.formatCurrency(data.bibleNOI * 1.03)}\nYear 3 NOI (3% growth): $${this.formatCurrency(data.bibleNOI * 1.0609)}\nYear 4 NOI (3% growth): $${this.formatCurrency(data.bibleNOI * 1.0927)}\nYear 5 NOI (3% growth): $${this.formatCurrency(data.bibleNOI * 1.1255)}\nCumulative 5-Year Pocket: $${this.formatCurrency(bestScenario?.pocket * 5 || 0)}`
      );

      // 4. Amortization Schedule
      yPos = this.addSection(
        doc,
        yPos,
        '4. Amortization Schedule',
        `Loan Amount: $${this.formatCurrency(bestScenario?.bankLoan || 0)}\nInterest Rate: ${(data.isCommercial ? BIBLE.COMMERCIAL.RATE : BIBLE.RESIDENTIAL.RATE) * 100}%\nAmortization Term: 25 years\nMonthly Payment: $${this.formatCurrency((bestScenario?.bankDS || 0) / 12)}\nFirst Year Principal: $${this.formatCurrency((bestScenario?.bankDS || 0) * 0.15)}\nFirst Year Interest: $${this.formatCurrency((bestScenario?.bankDS || 0) * 0.85)}`
      );

      // 5. Cap Sensitivity
      const capRate1 = ((data.bibleNOI / data.price) * 100).toFixed(2);
      const capRate2 = ((data.bibleNOI * 1.1 / data.price) * 100).toFixed(2);
      const capRate3 = ((data.bibleNOI * 0.9 / data.price) * 100).toFixed(2);
      yPos = this.addSection(
        doc,
        yPos,
        '5. Cap Sensitivity Analysis',
        `Current Cap Rate: ${capRate1}%\n\nIf NOI increases 10%:\n  New Bible NOI: $${this.formatCurrency(data.bibleNOI * 1.1)}\n  New Cap Rate: ${capRate2}%\n\nIf NOI decreases 10%:\n  New Bible NOI: $${this.formatCurrency(data.bibleNOI * 0.9)}\n  New Cap Rate: ${capRate3}%`
      );

      // 6. Diligence Confidence
      const scenarios = data.scenarios;
      const passes = scenarios.filter((s) => s.passes).length;
      const confidence = Math.round((passes / scenarios.length) * 100);
      yPos = this.addSection(
        doc,
        yPos,
        '6. Diligence Confidence',
        `Passing Scenarios: ${passes} of ${scenarios.length} (${confidence}%)\nConfidence Level: ${confidence >= 75 ? 'High' : confidence >= 50 ? 'Medium' : 'Low'}\nKey Risks: [To be completed]\nMitigation Strategies: [To be completed]\nFinal Recommendation: ${data.bestStructure || 'Requires renegotiation'}`
      );

      // Page numbers
      const pages = doc.bufferedPageRange().count;
      for (let i = 0; i < pages; i++) {
        doc.switchToPage(i);
        doc.fontSize(9).font('Helvetica').text(
          `Page ${i + 1} of ${pages}`,
          50,
          doc.page.height - 30,
          { align: 'right' }
        );
      }

      doc.end();
    });
  }

  /**
   * Helper: Add a section to PDF
   */
  addSection(doc, yPos, title, content) {
    const pageHeight = doc.page.height;
    const bottomMargin = 50;
    const sectionHeight = 180; // Check room for full section

    if (yPos + sectionHeight > pageHeight - bottomMargin) {
      doc.addPage();
      yPos = 50;
    }

    doc.fontSize(12).font('Helvetica-Bold').text(title, 50, yPos);
    doc.fontSize(10).font('Helvetica').text(content, 50, yPos + 20, {
      width: 500,
      align: 'left',
    });

    const lines = content.split('\n').length + 2;
    return yPos + lines * 15 + 25;
  }

  /**
   * Helper: Add scenario matrix table
   */
  addScenarioMatrix(doc, yPos, scenarios) {
    const pageHeight = doc.page.height;
    const bottomMargin = 50;

    if (yPos + 200 > pageHeight - bottomMargin) {
      doc.addPage();
      yPos = 50;
    }

    doc.fontSize(12).font('Helvetica-Bold').text('9. 8-Scenario Matrix', 50, yPos);
    yPos += 25;

    // Table header
    doc.fontSize(9).font('Helvetica-Bold');
    const colW = 60;
    const cols = [
      'Scenario',
      'DSCR',
      'Structure',
      'Bank Loan',
      'Bank DS',
      'Equity Cost',
      'Pocket',
      'Status',
    ];

    let x = 50;
    cols.forEach((col) => {
      doc.text(col, x, yPos, { width: colW - 5, fontSize: 8 });
      x += colW;
    });

    yPos += 15;
    doc.moveTo(50, yPos).lineTo(50 + colW * 8, yPos).stroke();
    yPos += 5;

    // Table rows
    doc.font('Helvetica').fontSize(8);
    scenarios.slice(0, 8).forEach((s) => {
      const bgColor = s.passes ? '#E8F5E9' : '#FFEBEE';
      // Draw background
      doc
        .rect(50, yPos - 2, colW * 8, 12)
        .fillAndStroke(bgColor, '#999999');

      // Draw text
      x = 50;
      const data = [
        s.name.substring(0, 10),
        s.actualDSCR.toFixed(2),
        s.structure.substring(0, 8),
        `$${(s.bankLoan / 1000).toFixed(0)}K`,
        `$${(s.bankDS / 1000).toFixed(0)}K`,
        `$${(s.equityCost / 1000).toFixed(0)}K`,
        `$${(s.pocket / 1000).toFixed(0)}K`,
        s.status,
      ];

      data.forEach((d) => {
        doc.text(d, x, yPos, { width: colW - 5 });
        x += colW;
      });

      yPos += 14;
    });

    return yPos + 20;
  }

  /**
   * Helper: Calculate ceiling price
   */
  calculateCeilingPrice(targetPocket, dscr, structure = 'No Equity') {
    const price = this.analysis.price;
    const grossIncome = this.analysis.grossIncome;
    const isCommercial = this.analysis.isCommercial;
    const ltv = isCommercial ? BIBLE.COMMERCIAL.LTV : BIBLE.RESIDENTIAL.LTV;
    const kFactor = isCommercial
      ? BIBLE.COMMERCIAL.K_FACTOR
      : BIBLE.RESIDENTIAL.K_FACTOR;
    const expenseFloor = isCommercial
      ? BIBLE.COMMERCIAL.EXPENSE_FLOOR
      : BIBLE.RESIDENTIAL.EXPENSE_FLOOR;

    // Iterate to find ceiling price
    let testPrice = price;
    let step = 10000;

    for (let i = 0; i < 20; i++) {
      const incomeRatio = grossIncome / price;
      const testIncome = testPrice * incomeRatio;
      const testNOI = testIncome - testIncome * expenseFloor;
      const testLoan = testPrice * ltv;
      const testDS = testLoan * kFactor;

      let testEquityCost = 0;
      if (structure === '8% IO') {
        testEquityCost = (testPrice - testLoan) * BIBLE.EQUITY.IO.K_FACTOR;
      } else if (structure === '8% Amortizing') {
        testEquityCost = (testPrice - testLoan) * BIBLE.EQUITY.AMORTIZING.K_FACTOR;
      }

      const testPocket = testNOI - testDS - testEquityCost;

      if (testPocket > targetPocket) {
        testPrice += step;
      } else {
        testPrice -= step;
        step = step / 2;
      }
    }

    return Math.round(testPrice / 1000) * 1000; // Round to nearest $1K
  }

  /**
   * Helper: Format currency
   */
  formatCurrency(value) {
    if (typeof value !== 'number') return '$0';
    return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
}

export default PDFGenerator;
