import { BIBLE_CONSTANTS, PropertyData } from './bible-constants';

export type Scenario = {
  dscr: number;
  structure: string;
  bank_loan: number;
  buyer_cash_equity: number;
  seller_carry: number;
  bank_ds: number;
  equity_cost: number;
  seller_ds: number;
  total_debt: number;
  pocket_money: number;
};

export class BibleCalculator {
  private data: PropertyData;
  public bible_noi: number = 0;
  public bible_expenses: number = 0;
  public bank_loan: number = 0;
  public buyer_equity: number = 0;
  public bank_ds: number = 0;
  public scenarios: Scenario[] = [];
  public ceiling_prices: any = {};

  constructor(propertyData: PropertyData) {
    this.data = propertyData;
    this.calculate();
  }

  private calculate(): void {
    const gross = this.data.gross_income;
    const price = this.data.asking_price;

    this.bible_expenses = Math.round(gross * BIBLE_CONSTANTS.EXPENSE_FLOOR);
    this.bible_noi = gross - this.bible_expenses;
    this.bank_loan = Math.round(price * BIBLE_CONSTANTS.LTV);
    this.buyer_equity = price - this.bank_loan;
    this.bank_ds = Math.round(this.bank_loan * BIBLE_CONSTANTS.K_COMM);

    this.buildScenarios();
    this.calculateCeilingPrices();
  }

  private buildScenarios(): void {
    this.scenarios = [];
    const dscr_levels = [1.25, 1.15];

    for (const dscr of dscr_levels) {
      // Bank Only
      this.scenarios.push({
        dscr,
        structure: 'Bank Only',
        bank_loan: this.bank_loan,
        buyer_cash_equity: this.buyer_equity,
        seller_carry: 0,
        bank_ds: this.bank_ds,
        equity_cost: 0,
        seller_ds: 0,
        total_debt: this.bank_ds,
        pocket_money: this.bible_noi - this.bank_ds,
      });

      // 8% IO
      const io_cost = Math.round(this.buyer_equity * 0.08);
      this.scenarios.push({
        dscr,
        structure: '8% Equity IO',
        bank_loan: this.bank_loan,
        buyer_cash_equity: this.buyer_equity,
        seller_carry: 0,
        bank_ds: this.bank_ds,
        equity_cost: io_cost,
        seller_ds: 0,
        total_debt: this.bank_ds + io_cost,
        pocket_money: this.bible_noi - (this.bank_ds + io_cost),
      });

      // 8% Amort
      const amort_cost = Math.round(this.buyer_equity * 0.09577);
      this.scenarios.push({
        dscr,
        structure: '8% Equity Amort',
        bank_loan: this.bank_loan,
        buyer_cash_equity: this.buyer_equity,
        seller_carry: 0,
        bank_ds: this.bank_ds,
        equity_cost: amort_cost,
        seller_ds: 0,
        total_debt: this.bank_ds + amort_cost,
        pocket_money: this.bible_noi - (this.bank_ds + amort_cost),
      });

      // Seller Finance
      const seller_note = this.data.asking_price - 100000 - this.bank_loan;
      const sf_buyer_cost = Math.round(100000 * 0.08);
      const sf_seller_ds = Math.round(seller_note * 0.07057);

      this.scenarios.push({
        dscr,
        structure: 'Seller Finance',
        bank_loan: this.bank_loan,
        buyer_cash_equity: 100000,
        seller_carry: Math.max(0, seller_note),
        bank_ds: this.bank_ds,
        equity_cost: sf_buyer_cost,
        seller_ds: sf_seller_ds,
        total_debt: this.bank_ds + sf_buyer_cost + sf_seller_ds,
        pocket_money: this.bible_noi - (this.bank_ds + sf_buyer_cost + sf_seller_ds),
      });
    }
  }

  private calculateCeilingPrices(): void {
    this.ceiling_prices = {
      'Bank Only': this.calcCeiling(this.bank_ds, 0, 0),
      '8% Equity IO': this.calcCeiling(this.bank_ds, this.buyer_equity * 0.08, 0),
      '8% Equity Amort': this.calcCeiling(this.bank_ds, this.buyer_equity * 0.09577, 0),
      'Seller Finance': this.calcCeiling(this.bank_ds, 100000 * 0.08, this.buyer_equity * 0.07057),
    };
  }

  private calcCeiling(bank_ds: number, equity_cost: number, seller_ds: number): any {
    return {
      pocket_25k: Math.round(((25000 + bank_ds + equity_cost + seller_ds) / 0.08679) / 0.75),
      pocket_10k: Math.round(((10000 + bank_ds + equity_cost + seller_ds) / 0.08679) / 0.75),
      breakeven: Math.round(((bank_ds + equity_cost + seller_ds) / 0.08679) / 0.75),
    };
  }
}
