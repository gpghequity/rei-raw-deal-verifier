import { BibleCalculator } from './bible-calculator';
import { PropertyData } from './bible-constants';

export class TeamAnalysisGenerator {
  private calc: BibleCalculator;

  constructor(propertyData: PropertyData) {
    this.calc = new BibleCalculator(propertyData);
  }

  generate(): any {
    const sections: any = {};

    // Section 1: Executive Summary
    const best = this.calc.scenarios
      .filter((s) => s.dscr === 1.25)
      .sort((a, b) => b.pocket_money - a.pocket_money)[0];

    sections['1_executive_summary'] = {
      title: '1. EXECUTIVE SUMMARY',
      content: `Analyzing ${this.calc.scenarios[0].bank_loan} with Bible NOI of $${this.calc.bible_noi.toLocaleString()}. Best structure: ${best?.structure || 'TBD'} with $${best?.pocket_money || 0} pocket money.`,
    };

    // Section 9: Eight-Scenario Matrix (most critical)
    sections['9_scenarios'] = this.generateScenarioTable();

    // Section 7: Ceiling Prices
    sections['7_ceiling_prices'] = this.generateCeilingTable();

    return { sections, calculator_data: this.calc };
  }

  private generateScenarioTable(): any {
    const rows = [['DSCR', 'Structure', 'Bank Loan', 'Buyer Cash', 'Seller Carry', 'Bank DS', 'Equity Cost', 'Seller DS', 'Total DS', 'Pocket Money']];

    for (const s of this.calc.scenarios) {
      rows.push([
        s.dscr.toFixed(2),
        s.structure,
        `$${s.bank_loan.toLocaleString()}`,
        `$${s.buyer_cash_equity.toLocaleString()}`,
        `$${s.seller_carry.toLocaleString()}`,
        `$${s.bank_ds.toLocaleString()}`,
        `$${s.equity_cost.toLocaleString()}`,
        `$${s.seller_ds.toLocaleString()}`,
        `$${s.total_debt.toLocaleString()}`,
        `$${s.pocket_money.toLocaleString()}`,
      ]);
    }

    return { title: '9. EIGHT-SCENARIO BIBLE MATRIX', rows };
  }

  private generateCeilingTable(): any {
    const rows = [['Structure', '$25K Pocket', '$10K Pocket', 'Breakeven']];

    for (const [structure, prices] of Object.entries(this.calc.ceiling_prices)) {
      rows.push([
        structure,
        `$${(prices as any).pocket_25k.toLocaleString()}`,
        `$${(prices as any).pocket_10k.toLocaleString()}`,
        `$${(prices as any).breakeven.toLocaleString()}`,
      ]);
    }

    return { title: '7. CEILING PRICES', rows };
  }
}
