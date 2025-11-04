import api from './api';
// import { StockPrice } from '../types';

export interface YearlyFinancials {
  // per share things
  share_price_at_report_date?: number;
  max_share_price?: number;
  min_share_price?: number;
  earnings_per_share?: number;
  dividend_per_share?: number;
  // profit loss
  revenue?: number;
  gross_profit?: number;
  profit_before_tax?: number;
  profit_after_tax?: number;
  profit_after_tax_for_shareholders?: number;
  // current assets
  cash?: number;
  inventories?: number;
  receivables?: number;
  investments_in_securities?: number;
  other_current_assets?: number;
  // non-current assets
  property_plant_equipment?: number;
  land_and_real_estate?: number;
  investments_subsidiaries?: number;
  intangible_assets?: number;
  non_current_investments?: number;
  other_non_current_assets?: number;
  // current liabilities
  borrowings?: number;
  payables?: number;
  lease_liabilities?: number;
  tax_liabilities?: number;
  other_current_liabilities?: number;
  // non-current liabilities
  long_term_debts?: number;
  long_term_lease_liabilities?: number;
  deferred_tax_liabilities?: number;
  other_non_current_liabilities?: number;
  // equity
  share_capital?: number;
  retained_earnings?: number;
  reserves?: number;
  non_controlling_interests?: number;
  // cash flow
  net_cash_from_operating_activities?: number;
  investments_in_ppe?: number;
  investments_in_subsidiaries?: number;
  investments_in_acquisitions?: number;
}

export interface YearlyFinancialsCalculated {
  // per share things
  number_of_shares?: number;
  average_share_price?: number;
  price_earnings_ratio_report_date?: number;
  price_earnings_ratio_max?: number;
  price_earnings_ratio_min?: number;
  dividend_amount?: number;
  dividend_payout_ratio?: number;
  dividend_yield?: number;
  // profit loss
  gross_margin?: number;
  profit_before_tax_margin?: number;
  profit_after_tax_for_shareholders_margin?: number;
  // assets
  total_current_assets?: number;
  total_non_current_assets?: number;
  total_assets?: number;
  // liabilities
  total_current_liabilities?: number;
  total_non_current_liabilities?: number;
  total_liabilities?: number;
  // asset metrics
  net_cash?: number;
  net_net_cash?: number;
  net_current_assets?: number;
  net_net_current_assets?: number;
  net_tangible_assets?: number;
  debt_to_equity_ratio?: number;
  // equity
  equity_attributable_to_shareholders?: number;
  total_equity?: number;
  total_liabilities_and_equity?: number;
  // cash flow
  free_cash_flow?: number;
}

export interface FinancialData {
  [year: string]: YearlyFinancials;
}

export interface FinancialDataCalculated {
  [year: string]: YearlyFinancialsCalculated;
}

export interface FinancialDataAll {
  [year: string]: YearlyFinancials & YearlyFinancialsCalculated;
}

export interface FinancialDataWithMeta {
  stock_id?: number;
  updated_at?: string;
  data: FinancialData;
}

export interface FinancialMetric {
  key: keyof YearlyFinancials | keyof YearlyFinancialsCalculated;
  label: string;
  unit?: string;
  decimals?: number;
  hoverText?: string;
}


export const financialService = {

  getFinancialData: async (stockId: number, signal?: AbortSignal): Promise<FinancialDataWithMeta> => {
    const response = await api.get(`/stocks/${stockId}/financials`, { signal });
    const financialData: FinancialDataWithMeta = { 
      stock_id: response.data.stock_id, 
      updated_at: response.data.updated_at, 
      data: response.data.data 
    };

    return financialData;
  },

  calculateMetrics: (data: FinancialData): FinancialDataCalculated => {
    const calculatedData: FinancialDataCalculated = {};

    Object.keys(data).forEach(year => {
      const yearData = data[year];

      // calculate dependent metrics first
      const numberOfShares = (yearData.earnings_per_share ?? 0) !== 0
        ? (yearData.profit_after_tax_for_shareholders ?? 0) / (yearData.earnings_per_share ?? 0)
        : 0;

      const averageSharePrice = ((yearData.max_share_price ?? 0) + (yearData.min_share_price ?? 0)) / 2;

      const totalCurrentAssets = (yearData.cash ?? 0) +
        (yearData.inventories ?? 0) +
        (yearData.receivables ?? 0) +
        (yearData.investments_in_securities ?? 0) +
        (yearData.other_current_assets ?? 0);

      const totalNonCurrentAssets = (yearData.property_plant_equipment ?? 0) +
        (yearData.land_and_real_estate ?? 0) +
        (yearData.investments_subsidiaries ?? 0) +
        (yearData.intangible_assets ?? 0) +
        (yearData.non_current_investments ?? 0) +
        (yearData.other_non_current_assets ?? 0);

      const totalAssets = (totalCurrentAssets ?? 0) + (totalNonCurrentAssets ?? 0);

      const totalCurrentLiabilities = (yearData.borrowings ?? 0) +
        (yearData.payables ?? 0) +
        (yearData.lease_liabilities ?? 0) +
        (yearData.tax_liabilities ?? 0) +
        (yearData.other_current_liabilities ?? 0);

      const totalNonCurrentLiabilities = (yearData.long_term_debts ?? 0) +
        (yearData.long_term_lease_liabilities ?? 0) +
        (yearData.deferred_tax_liabilities ?? 0) +
        (yearData.other_non_current_liabilities ?? 0);

      const totalLiabilities = (totalCurrentLiabilities ?? 0) + (totalNonCurrentLiabilities ?? 0);

      const equityAttributableToShareholders = (yearData.share_capital ?? 0) +
        (yearData.reserves ?? 0) +
        (yearData.retained_earnings ?? 0);

      const totalEquity = (equityAttributableToShareholders ?? 0) +
        (yearData.non_controlling_interests ?? 0);

      // then calculate other metrics and put into obj
      calculatedData[year] = {
        // per share things
        number_of_shares: numberOfShares,

        average_share_price: averageSharePrice,

        price_earnings_ratio_report_date: (yearData.earnings_per_share ?? 0) !== 0
          ? (yearData.share_price_at_report_date ?? 0) / (yearData.earnings_per_share ?? 0)
          : 0,

        price_earnings_ratio_max: (yearData.earnings_per_share ?? 0) !== 0
          ? (yearData.max_share_price ?? 0) / (yearData.earnings_per_share ?? 0)
          : 0,
      
        price_earnings_ratio_min: (yearData.earnings_per_share ?? 0) !== 0
          ? (yearData.min_share_price ?? 0) / (yearData.earnings_per_share ?? 0)
          : 0,

        dividend_amount: (yearData.dividend_per_share ?? 0) * (numberOfShares ?? 0),

        dividend_yield: (averageSharePrice ?? 0) !== 0
          ? 100 * (yearData.dividend_per_share ?? 0) / (averageSharePrice ?? 0)
          : 0,

        dividend_payout_ratio: (yearData.earnings_per_share ?? 0) !== 0
          ? (yearData.dividend_per_share ?? 0) / (yearData.earnings_per_share ?? 0)
          : 0,

        // profit loss
        gross_margin: (yearData.revenue ?? 0) !== 0
          ? 100 * (yearData.gross_profit ?? 0) / (yearData.revenue ?? 0)
          : 0,

        profit_before_tax_margin:  (yearData.revenue ?? 0) !== 0
          ? 100 * (yearData.profit_before_tax ?? 0) / (yearData.revenue ?? 0)
          : 0,

        profit_after_tax_for_shareholders_margin: (yearData.revenue ?? 0) !== 0
          ? 100 * (yearData.profit_after_tax_for_shareholders ?? 0) / (yearData.revenue ?? 0)
          : 0,

        // assets
        total_current_assets: totalCurrentAssets,

        total_non_current_assets: totalNonCurrentAssets,

        total_assets: totalAssets,

        // liabilities
        total_current_liabilities: totalCurrentLiabilities,

        total_non_current_liabilities: totalNonCurrentLiabilities,

        total_liabilities: totalLiabilities,

        // asset metrics
        net_cash: (yearData.cash ?? 0) - (totalCurrentLiabilities ?? 0),

        net_net_cash: (yearData.cash ?? 0) - (totalLiabilities ?? 0),

        net_current_assets: (totalCurrentAssets ?? 0) - (totalCurrentLiabilities ?? 0),

        net_net_current_assets: (totalCurrentAssets ?? 0) - (totalLiabilities ?? 0),

        net_tangible_assets: (totalAssets ?? 0) -
          (yearData.intangible_assets ?? 0) -
          (totalLiabilities ?? 0) -
          (yearData.non_controlling_interests ?? 0),

        debt_to_equity_ratio: (totalEquity ?? 0) !== 0
          ? (totalLiabilities ?? 0) / (totalEquity ?? 0)
          : 0,

        // equity
        equity_attributable_to_shareholders: equityAttributableToShareholders,

        total_equity: totalEquity,

        total_liabilities_and_equity: (totalLiabilities ?? 0) +
          (totalEquity ?? 0),

        // cash flow
        free_cash_flow: (yearData.net_cash_from_operating_activities ?? 0) - (yearData.investments_in_ppe ?? 0)
      };
    })
    return calculatedData;
  },

  saveFinancialData: async (stockId: number, data: FinancialDataWithMeta): Promise<any> => {
    const financialData: FinancialDataWithMeta = { stock_id: data.stock_id, data: data.data };

    const response = await api.post(`/stocks/${stockId}/financials`, financialData);
    return response.data;
  },

  // Calculate percentage increase (with CAGR for first year)
  calculatePercentageIncrease: (
    currentYear: string,
    years: string[],
    metricKey: keyof YearlyFinancials | keyof YearlyFinancialsCalculated,
    financialDataAll: FinancialDataAll
  ): string | number | null => {
    const currentYearIndex = years.indexOf(currentYear);
    if (currentYearIndex < 0) return null; // No previous year to compare

    const currentValue = financialDataAll[currentYear]?.[metricKey];

    if (currentYearIndex === 0) { // for CAGR calculation at the first year
      const nYears = years.length;
      const latestValue = financialDataAll[years[nYears - 1]]?.[metricKey];
      if (latestValue && currentValue && latestValue > 0 && currentValue > 0 && nYears > 1) {
        const CAGR = (Math.pow((latestValue / currentValue), (1 / (nYears - 1))) - 1) * 100;
        if (CAGR > 0) {
          return `CAGR = +${CAGR.toFixed(1)}%`;
        } else {
          return `CAGR = ${CAGR.toFixed(1)}%`;
        }
      } else return null;
    }
    
    const previousYear = years[currentYearIndex - 1];
    const previousValue = financialDataAll[previousYear]?.[metricKey];
    if (!currentValue || !previousValue || previousValue === 0) return null;

    const revenueIncrease = ((currentValue - previousValue) / previousValue) * 100;
    return revenueIncrease;
    // if (revenueIncrease > 0) {
    //   return `+${revenueIncrease.toFixed(1)}%`;
    // } else {
    //   return `${revenueIncrease.toFixed(1)}%`;
    // }
  },

};

export default financialService;



