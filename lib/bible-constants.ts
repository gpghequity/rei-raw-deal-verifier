// REI PLATFORM BIBLE v11.24 - LOCKED CONSTANTS PER ASSET TYPE
export const BIBLE_CONSTANTS_BY_TYPE = {
  'Commercial': {
    LTV: 0.75,
    EQUITY_PERCENT: 0.25,
    K_COMM: 0.08679,
    EXPENSE_FLOOR: 0.35,
    POCKET_FLOOR_CONSERVATIVE: 10000,
    POCKET_FLOOR_AGGRESSIVE: 0,
  },
  'Residential': {
    LTV: 0.75,
    EQUITY_PERCENT: 0.25,
    K_COMM: 0.08679,
    EXPENSE_FLOOR: 0.25, // Different from commercial
    POCKET_FLOOR_CONSERVATIVE: 10000,
    POCKET_FLOOR_AGGRESSIVE: 0,
  },
  'Storage': {
    LTV: 0.75,
    EQUITY_PERCENT: 0.25,
    K_COMM: 0.08679,
    EXPENSE_FLOOR: 0.30,
    POCKET_FLOOR_CONSERVATIVE: 10000,
    POCKET_FLOOR_AGGRESSIVE: 0,
  },
  'MHP': {
    LTV: 0.75,
    EQUITY_PERCENT: 0.25,
    K_COMM: 0.08679,
    EXPENSE_FLOOR: 0.35,
    POCKET_FLOOR_CONSERVATIVE: 10000,
    POCKET_FLOOR_AGGRESSIVE: 0,
  },
  'RV Park': {
    LTV: 0.75,
    EQUITY_PERCENT: 0.25,
    K_COMM: 0.08679,
    EXPENSE_FLOOR: 0.35,
    POCKET_FLOOR_CONSERVATIVE: 10000,
    POCKET_FLOOR_AGGRESSIVE: 0,
  },
  'Mixed-Use': {
    LTV: 0.75,
    EQUITY_PERCENT: 0.25,
    K_COMM: 0.08679,
    EXPENSE_FLOOR: 0.35,
    POCKET_FLOOR_CONSERVATIVE: 10000,
    POCKET_FLOOR_AGGRESSIVE: 0,
  },
};

// Shared constants across all types
export const BIBLE_SHARED = {
  BANK_RATE: 0.0725,
  BANK_AMORTIZATION_YEARS: 25,
  DSCR_CONSERVATIVE: 1.25,
  DSCR_AGGRESSIVE: 1.15,
  SELLER_FINANCE_BUYER_CASH: 100000,
  SELLER_NOTE_RATE: 0.05,
  SELLER_NOTE_AMORTIZATION_YEARS: 25,
  SELLER_NOTE_BALLOON_YEARS: 15,
  K_SELLER: 0.07057,
  K_IO: 0.08,
  K_AMORT: 0.09577,
  EQUITY_AMORTIZATION_YEARS: 25,
};

export type PropertyData = {
  address: string;
  asking_price: number;
  gross_income: number;
  seller_expenses?: number;
  entity?: string;
  units?: number;
  asset_type: string;
};

export function getBibleConstants(asset_type: string) {
  return BIBLE_CONSTANTS_BY_TYPE[asset_type as keyof typeof BIBLE_CONSTANTS_BY_TYPE] || BIBLE_CONSTANTS_BY_TYPE['Commercial'];
}
