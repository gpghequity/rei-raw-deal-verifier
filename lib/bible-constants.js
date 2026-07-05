/**
 * Bible Constants - LOCKED
 * These values are the source of truth for all underwriting math
 * v11.24
 */

export const BIBLE = {
  // Residential
  RESIDENTIAL: {
    LTV: 0.80,
    RATE: 0.07,
    K_FACTOR: 0.08104,
    DSCR_ONLY: 1.25,
    EXPENSE_FLOOR: 0.15,
    SCENARIOS: [
      { name: '0% Pad', pad: 0.00 },
      { name: '15% Pad', pad: 0.15 },
      { name: '30% Pad', pad: 0.30 },
    ],
  },

  // Commercial
  COMMERCIAL: {
    LTV: 0.75,
    RATE: 0.0725,
    K_FACTOR: 0.08679,
    DSCR_OPTIONS: [1.25, 1.15],
    EXPENSE_FLOOR: 0.35,
    SCENARIOS: [
      { name: '0% Pad @ 1.25 DSCR', pad: 0.00, dscr: 1.25 },
      { name: '15% Pad @ 1.25 DSCR', pad: 0.15, dscr: 1.25 },
      { name: '30% Pad @ 1.25 DSCR', pad: 0.30, dscr: 1.25 },
      { name: '0% Pad @ 1.15 DSCR', pad: 0.00, dscr: 1.15 },
      { name: '15% Pad @ 1.15 DSCR', pad: 0.15, dscr: 1.15 },
      { name: '30% Pad @ 1.15 DSCR', pad: 0.30, dscr: 1.15 },
      { name: 'Conservative @ 1.25 DSCR', pad: 0.15, dscr: 1.25 }, // fallback
      { name: 'Conservative @ 1.15 DSCR', pad: 0.15, dscr: 1.15 }, // fallback
    ],
  },

  // Equity Structures
  EQUITY: {
    IO: {
      RATE: 0.08,
      K_FACTOR: 0.08, // 8% IO = just interest
    },
    AMORTIZING: {
      RATE: 0.08,
      K_FACTOR: 0.09577, // 8% amortizing
    },
  },

  // Seller Finance
  SELLER_FINANCE: {
    BUYER_AMOUNT: 100000, // $100K
    BUYER_RATE: 0.08, // 8%
    BUYER_TERM_YEARS: 25,
    SELLER_AMOUNT: 75000, // $75K
    SELLER_RATE: 0.05, // 5%
    SELLER_TERM_YEARS: 15,
    SELLER_BALLOON_YEARS: 15,
    K_SELLER: 0.07057, // Seller Finance K factor
  },

  // Asset Types
  ASSET_TYPES: [
    'Single Family',
    'Multi-Family 2-4',
    'Multi-Family 5+',
    'Commercial',
    'Industrial Outdoor Storage (IOS)',
    'RV Park',
    'Mobile Home Park (MHP)',
    'Storage',
    'Mixed-Use',
  ],

  // Pocket Floor (minimum acceptable profit)
  POCKET_FLOORS: {
    '0K': 0,
    '10K': 10000,
    '25K': 25000,
  },
};

export default BIBLE;
