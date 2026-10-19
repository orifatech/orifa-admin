/**
 * Paystack Multi-Currency & Regional Configuration
 * 
 * Supports local African currencies (NGN, GHS, KES, ZAR) and global USD payments.
 */

export interface CountryCurrencyConfig {
  code: string;
  name: string;
  currency: "NGN" | "GHS" | "KES" | "ZAR" | "USD";
  symbol: string;
  flag: string;
  defaultMonthlyRetainer: number; // In standard units
  // Approximate NGN exchange rate for fallback conversion if merchant account is strictly NGN-denominated
  ngnExchangeRate: number; 
}

export const SUPPORTED_PAYSTACK_COUNTRIES: Record<string, CountryCurrencyConfig> = {
  NG: {
    code: "NG",
    name: "Nigeria",
    currency: "NGN",
    symbol: "₦",
    flag: "🇳🇬",
    defaultMonthlyRetainer: 500000, // ₦500,000 / month
    ngnExchangeRate: 1,
  },
  GH: {
    code: "GH",
    name: "Ghana",
    currency: "GHS",
    symbol: "GH₵",
    flag: "🇬🇭",
    defaultMonthlyRetainer: 4500, // GH₵4,500 / month
    ngnExchangeRate: 110,
  },
  KE: {
    code: "KE",
    name: "Kenya",
    currency: "KES",
    symbol: "KSh",
    flag: "🇰🇪",
    defaultMonthlyRetainer: 45000, // KSh 45,000 / month
    ngnExchangeRate: 11.5,
  },
  ZA: {
    code: "ZA",
    name: "South Africa",
    currency: "ZAR",
    symbol: "R",
    flag: "🇿🇦",
    defaultMonthlyRetainer: 6000, // R 6,000 / month
    ngnExchangeRate: 85,
  },
  US: {
    code: "US",
    name: "Global / United States (USD)",
    currency: "USD",
    symbol: "$",
    flag: "🌐",
    defaultMonthlyRetainer: 350, // $350 / month
    ngnExchangeRate: 1550,
  },
};

/**
 * Resolves country code and currency configuration from either:
 * 1. Explicit organization country code (ISO-2)
 * 2. Client browser timeZone string (e.g. "Africa/Lagos", "Africa/Nairobi", "Africa/Accra")
 */
export function resolveCountryAndCurrency(
  explicitCountry?: string,
  timeZone?: string
): CountryCurrencyConfig {
  if (explicitCountry && SUPPORTED_PAYSTACK_COUNTRIES[explicitCountry.toUpperCase()]) {
    return SUPPORTED_PAYSTACK_COUNTRIES[explicitCountry.toUpperCase()];
  }

  if (timeZone) {
    const tz = timeZone.toLowerCase();
    if (tz.includes("lagos")) return SUPPORTED_PAYSTACK_COUNTRIES.NG;
    if (tz.includes("accra")) return SUPPORTED_PAYSTACK_COUNTRIES.GH;
    if (tz.includes("nairobi")) return SUPPORTED_PAYSTACK_COUNTRIES.KE;
    if (tz.includes("johannesburg")) return SUPPORTED_PAYSTACK_COUNTRIES.ZA;
  }

  // Default to global USD
  return SUPPORTED_PAYSTACK_COUNTRIES.US;
}

/**
 * Format currency amount with symbol and thousands separators
 */
export function formatCurrencyAmount(
  amount: number,
  currency: string = "USD"
): string {
  const symbolMap: Record<string, string> = {
    NGN: "₦",
    GHS: "GH₵",
    KES: "KSh ",
    ZAR: "R ",
    USD: "$",
  };

  const symbol = symbolMap[currency] || `${currency} `;
  return `${symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/**
 * Convert standard currency amount to smallest subunit (kobo, pesewas, cents)
 * Paystack requires all amounts in integer minor units.
 */
export function toMinorUnit(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Convert smallest subunit (kobo, pesewas, cents) back to standard unit
 */
export function fromMinorUnit(minorAmount: number): number {
  return minorAmount / 100;
}
