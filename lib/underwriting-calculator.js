/**
 * Underwriting Calculator
 * All math follows Bible v11.24 constants
 */

import BIBLE from './bible-constants.js';

export class UnderwritingCalculator {
  constructor(assetType, price, grossIncome, expenses = null) {
    this.assetType = assetType;
    this.price = price;
    this.grossIncome = grossIncome;
    this.expenses = expenses;
    this.isCommercial = this.isCommercialAsset(assetType);
    this.isResidential = !this.isCommercial;
  }

  isCommercialAsset(assetType) {
    const commercialTypes = [
      'Commercial',
      'Industrial Outdoor Storage (IOS)',
      'RV Park',
      'Mobile Home Park (MHP)',
      'Storage',
    ];
    return commercialTypes.includes(assetType);
  }

  /**
   * Calculate Bible NOI = Gross Income - (Gross × Expense Floor)
   */
  calculateBibleNOI() {
    const expenseFloor = this.isCommercial
      ? BIBLE.COMMERCIAL.EXPENSE_FLOOR
      : BIBLE.RESIDENTIAL.EXPENSE_FLOOR;

    const calculatedExpenses = this.grossIncome * expenseFloor;
    return Math.round((this.grossIncome - calculatedExpenses) * 100) / 100;
  }

  /**
   * Calculate scenarios (residential = 3, commercial = 8)
   */
  calculateScenarios() {
    const bibleNOI = this.calculateBibleNOI();
    const scenarios = [];

    if (this.isResidential) {
      // Residential: 3 scenarios only (0%, 15%, 30% pads, all @ 1.25 DSCR)
      const scenarioConfigs = BIBLE.RESIDENTIAL.SCENARIOS;

      scenarioConfigs.forEach((config) => {
        const paddedNOI = bibleNOI * (1 + config.pad);
        const scenario = this.calculateScenarioDetail(
          config.name,
          paddedNOI,
          BIBLE.RESIDENTIAL.DSCR_ONLY,
          BIBLE.RESIDENTIAL.LTV,
          BIBLE.RESIDENTIAL.K_FACTOR
        );
        scenarios.push(scenario);
      });
    } else {
      // Commercial: 8 scenarios (4 @ 1.25, 4 @ 1.15)
      const dscrs = BIBLE.COMMERCIAL.DSCR_OPTIONS;
      const pads = [0.0, 0.15, 0.3, 0.15]; // Mix for variety

      let index = 0;
      for (let d = 0; d < dscrs.length; d++) {
        const dscr = dscrs[d];
        const basePads = d === 0 ? [0.0, 0.15, 0.3] : [0.15];

        basePads.forEach((pad, idx) => {
          const paddedNOI = bibleNOI * (1 + pad);
          const scenarioName = `${pad * 100}% Pad @ ${dscr} DSCR`;

          const scenario = this.calculateScenarioDetail(
            scenarioName,
            paddedNOI,
            dscr,
            BIBLE.COMMERCIAL.LTV,
            BIBLE.COMMERCIAL.K_FACTOR
          );
          scenarios.push(scenario);
        });
      }

      // Ensure we have 8 scenarios
      while (scenarios.length < 8) {
        const lastScenario = scenarios[scenarios.length - 1];
        scenarios.push({
          ...lastScenario,
          name: `Fallback ${scenarios.length + 1}`,
        });
      }

      scenarios.splice(8); // Keep only 8
    }

    return scenarios;
  }

  /**
   * Calculate single scenario detail
   */
  calculateScenarioDetail(
    name,
    noi,
    dscr,
    ltv,
    kFactor,
    equityStructure = 'No Equity'
  ) {
    // Bank Loan = Price × LTV
    const bankLoan = Math.round(this.price * ltv * 100) / 100;

    // Bank Debt Service = Bank Loan × K Factor
    const bankDS = Math.round(bankLoan * kFactor * 100) / 100;

    // Equity Cost depends on structure
    let equityCost = 0;
    let equityType = 'None';

    if (equityStructure === '8% IO') {
      // Interest-only: Equity × 0.08
      const equity = this.price - bankLoan;
      equityCost = Math.round(equity * BIBLE.EQUITY.IO.K_FACTOR * 100) / 100;
      equityType = '8% IO';
    } else if (equityStructure === '8% Amortizing') {
      // Amortizing: Equity × 0.09577
      const equity = this.price - bankLoan;
      equityCost = Math.round(
        equity * BIBLE.EQUITY.AMORTIZING.K_FACTOR * 100
      ) / 100;
      equityType = '8% Amort';
    } else if (equityStructure === 'Seller Finance') {
      // Seller Finance: Calculate DS on seller portion
      const buyerDS = Math.round(
        BIBLE.SELLER_FINANCE.BUYER_AMOUNT *
          this.calculateKFactor(
            BIBLE.SELLER_FINANCE.BUYER_RATE,
            BIBLE.SELLER_FINANCE.BUYER_TERM_YEARS
          ) *
          100
      ) / 100;
      const sellerDS = Math.round(
        BIBLE.SELLER_FINANCE.SELLER_AMOUNT *
          BIBLE.SELLER_FINANCE.K_SELLER *
          100
      ) / 100;
      equityCost = buyerDS + sellerDS;
      equityType = 'Seller Fin';
    }

    // Pocket = NOI - Bank DS - Equity Cost - Seller DS
    const totalDS = bankDS + equityCost;
    const pocket = Math.round((noi - totalDS) * 100) / 100;

    // DSCR check: NOI / Bank DS >= DSCR target
    const actualDSCR = bankDS > 0 ? noi / bankDS : 0;
    const meetsRequirement = actualDSCR >= dscr;

    return {
      name,
      noi: Math.round(noi * 100) / 100,
      dscr,
      actualDSCR: Math.round(actualDSCR * 100) / 100,
      structure: equityType,
      bankLoan,
      bankDS,
      equityCost,
      totalDS,
      pocket,
      passes: meetsRequirement,
      status: meetsRequirement ? 'PASS' : 'FAIL',
    };
  }

  /**
   * Calculate K Factor from rate and term
   */
  calculateKFactor(rate, termYears) {
    const monthlyRate = rate / 12;
    const numPayments = termYears * 12;
    if (monthlyRate === 0) return 1 / numPayments;
    const kFactor =
      (monthlyRate * (1 + monthlyRate) ** numPayments) /
      ((1 + monthlyRate) ** numPayments - 1);
    return kFactor;
  }

  /**
   * Calculate ceiling price for target pocket
   * Backward: required pocket + costs = required NOI → max price
   */
  calculateCeilingPrice(targetPocket, dscr, structure) {
    const bibleNOI = this.calculateBibleNOI();
    const ltv = this.isCommercial
      ? BIBLE.COMMERCIAL.LTV
      : BIBLE.RESIDENTIAL.LTV;
    const kFactor = this.isCommercial
      ? BIBLE.COMMERCIAL.K_FACTOR
      : BIBLE.RESIDENTIAL.K_FACTOR;

    // Estimate equity cost for this structure
    let equityCostPct = 0;
    if (structure === '8% IO') {
      equityCostPct = (1 - ltv) * BIBLE.EQUITY.IO.K_FACTOR;
    } else if (structure === '8% Amortizing') {
      equityCostPct = (1 - ltv) * BIBLE.EQUITY.AMORTIZING.K_FACTOR;
    } else if (structure === 'Seller Finance') {
      // Simplified: estimate SF cost
      equityCostPct = 0.06; // placeholder
    }

    // Reverse engineer: Price = (required NOI - equity cost) / (bankDS% + equity%)
    // For simplicity, use: required NOI = targetPocket + Bank DS cost
    // Bank DS cost pct = LTV × K Factor
    // So: max price where NOI = Price × expenseFloor reduction
    // This requires iteration or approximation

    // Simplified approach: iterate to find ceiling price
    let lowPrice = 0;
    let highPrice = this.price * 2;
    let ceilingPrice = this.price;

    for (let i = 0; i < 20; i++) {
      const testPrice = (lowPrice + highPrice) / 2;
      const calc = new UnderwritingCalculator(
        this.assetType,
        testPrice,
        this.grossIncome
      );
      const testBibleNOI = calc.calculateBibleNOI();
      const testBankLoan = testPrice * ltv;
      const testBankDS = testBankLoan * kFactor;
      const testEquityCost = testPrice * (1 - ltv) * equityCostPct;
      const testPocket = testBibleNOI - testBankDS - testEquityCost;

      if (testPocket > targetPocket) {
        ceilingPrice = testPrice;
        lowPrice = testPrice;
      } else {
        highPrice = testPrice;
      }
    }

    return Math.round(ceilingPrice);
  }

  /**
   * Get all ceiling prices for common targets
   */
  getCeilingPrices(structures = ['No Equity', '8% IO', '8% Amortizing']) {
    const targets = [25000, 10000, 0]; // $25K, $10K, Breakeven
    const ceilings = {};

    targets.forEach((target) => {
      ceilings[`$${target}`] = {};
      structures.forEach((struct) => {
        const dscr = this.isCommercial
          ? BIBLE.COMMERCIAL.DSCR_OPTIONS[0]
          : BIBLE.RESIDENTIAL.DSCR_ONLY;
        ceilings[`$${target}`][struct] = this.calculateCeilingPrice(
          target,
          dscr,
          struct
        );
      });
    });

    return ceilings;
  }

  /**
   * Get summary analysis
   */
  getSummary() {
    const bibleNOI = this.calculateBibleNOI();
    const scenarios = this.calculateScenarios();
    const bestPass = scenarios.filter((s) => s.passes).sort((a, b) => b.pocket - a.pocket)[0];

    return {
      assetType: this.assetType,
      price: this.price,
      grossIncome: this.grossIncome,
      expensesPercentage: this.isCommercial
        ? BIBLE.COMMERCIAL.EXPENSE_FLOOR * 100
        : BIBLE.RESIDENTIAL.EXPENSE_FLOOR * 100,
      bibleNOI,
      scenarios,
      bestPass,
      bestStructure: bestPass ? bestPass.structure : 'None Pass',
      bestPocket: bestPass ? bestPass.pocket : null,
      passCount: scenarios.filter((s) => s.passes).length,
      failCount: scenarios.filter((s) => !s.passes).length,
    };
  }
}

export default UnderwritingCalculator;
