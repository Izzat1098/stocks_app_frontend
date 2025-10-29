import api from './api';
import { FinancialDataAll } from './financialService'; 


export interface InvestmentSummary {
  curr_date?: string;
  current_share_price?: number;
  past_4q_revenue?: number;
  past_4q_net_profit?: number;
  past_4q_earnings_per_share?: number;
  stock_type?: string;
  invest?: string;
  investment_reasoning?: string;
  calculated_field?: string;
}

export interface InvestmentSummaryField {
  key: keyof InvestmentSummary;
  label: string;
  secondary_label?: string;
  type: 'input' | 'select' | 'textarea' | 'calculated' | 'date';
  inputType?: 'text' | 'number' | 'date';
  step?: string;
  decimals?: number;
  placeholder?: string;
  rows?: number;
  options?: { value: string; label: string }[];
  optionStyles?: { [value: string]: { backgroundColor: string; color: string } };
  calculate?: (summary: InvestmentSummary, financialDataAll: FinancialDataAll) => Array<string | number | null | undefined>;
  format?: (value: any) => string;
}

export const investmentSummaryFields: InvestmentSummaryField[] = [
  {
    key: 'curr_date',
    label: 'Current Date:',
    type: 'date',
    inputType: 'date',
  },
  {
    key: 'current_share_price',
    label: 'Current Share Price ($):',
    type: 'input',
    inputType: 'text',
    step: '0.01',
    placeholder: '0.00',
    decimals: 2,
  },
  {
    key: 'past_4q_revenue',
    label: 'Past 4-Quarters Revenue ($):',
    type: 'input',
    inputType: 'text',
    step: '0.01',
    placeholder: '0.00',
  },
  {
    key: 'past_4q_net_profit',
    label: 'Past 4-Quarters Profit After Tax For Shareholders ($):',
    type: 'input',
    inputType: 'text',
    step: '0.01',
    placeholder: '0.00',
  },
  {
    key: 'past_4q_earnings_per_share',
    label: 'Past 4-Quarters Earnings Per Share ($):',
    type: 'input',
    inputType: 'text',
    step: '0.01',
    placeholder: '0.00',
    decimals: 2,
  },
  {
    key: 'calculated_field',
    label: 'Net Profit Margin (%):',
    secondary_label: 'vs Latest Year',
    type: 'calculated',
    calculate: (summary, financialDataAll) => {
      let currentNetMargin = null;
      const revenue = summary.past_4q_revenue;
      const netProfit = summary.past_4q_net_profit;

      if (!revenue || !netProfit || revenue === 0) {
          currentNetMargin = null;
      } else {
          currentNetMargin = (netProfit / revenue) * 100;
      }

      let netMarginIncrease = null;
      const nYears = Object.keys(financialDataAll).length;
      const lastYearMargin = nYears > 1 
        ? financialDataAll[Object.keys(financialDataAll)[nYears - 1]].profit_after_tax_for_shareholders_margin 
        : null;
  
      if (!currentNetMargin || !lastYearMargin || lastYearMargin === 0) {
        netMarginIncrease = null;
      } else {
        netMarginIncrease = 100 * (currentNetMargin - lastYearMargin) / lastYearMargin;
      }

      return [currentNetMargin, netMarginIncrease];
    },
    format: (value) => value !== null ? `${value.toFixed(2)}%` : '-',
  },
  {
    key: 'calculated_field',
    label: 'Current Price Earnings Ratio:',
    type: 'calculated',
    calculate: (summary) => {
      const sharePrice = summary.current_share_price;
      const eps = summary.past_4q_earnings_per_share;
      if (!sharePrice || !eps || eps === 0) return [null];
      return [sharePrice / eps];
    },
    format: (value) => value !== null ? value.toFixed(2) : '-',
  },
  {
    key: 'calculated_field',
    label: 'Number of Shares:',
    secondary_label: '% vs Latest Year',
    type: 'calculated',
    calculate: (summary, financialDataAll) => {
      const netProfit = summary.past_4q_net_profit;
      const eps = summary.past_4q_earnings_per_share;
      let numShares = null;
      if (!netProfit || !eps || eps === 0) {
        numShares = null;
      } else {
        numShares = netProfit / eps;
      }

      let numSharesIncrease = null;
      const nYears = Object.keys(financialDataAll).length;
      const lastYearShares = nYears > 1 
        ? financialDataAll[Object.keys(financialDataAll)[nYears - 1]].number_of_shares 
        : null;

      if (!numShares || !lastYearShares || lastYearShares === 0) {
        numSharesIncrease = null;
      } else {
        numSharesIncrease = 100 * (numShares - lastYearShares) / lastYearShares;
      }
      return [numShares, numSharesIncrease];
    },
    format: (value) => {
      if (value === null) return '-';
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    },
  },
  {
    key: 'stock_type',
    label: 'What is the stock type?',
    type: 'select',
    options: [
      { value: '', label: 'Select stock type...' },
      { value: 'slow_grower', label: 'Slow Grower: <10% NP Growth' },
      { value: 'stalwart', label: 'Stalwart/Med Grower: 10-20% NP Growth' },
      { value: 'baggers', label: 'Baggers/Fast Grower: >20% NP Growth' },
      { value: 'cyclicals', label: 'Cyclicals: Cyclic NP trend' },
      { value: 'turnaround', label: 'Turnaround: Downtrodden in turnaround plan' },
      { value: 'asset_play', label: 'Asset Play: Have huge hidden assets' },
      { value: 'dead_stock', label: 'DEAD Stock: Static or downward NP trend' },
    ],
  },
  {
    key: 'calculated_field',
    label: 'Average Dividend Yield (%):',
    type: 'calculated',
    calculate: (summary, financialDataAll) => {
      const years = Object.keys(financialDataAll).sort();
      if (years.length === 0) return [null];
      let totalDividends = 0;
      let count = 0;
      years.forEach(year => {
        const dividend = financialDataAll[year]?.dividend_yield;
        if (dividend !== undefined && dividend !== null) {
          totalDividends += dividend;
          count++;
        }
      });
      return count > 0 ? [totalDividends / count] : [null];
    },
    format: (value) => value !== null ? `${value.toFixed(2)}%` : '-',
  },
  {
    key: 'invest',
    label: 'Investment Action',
    type: 'select',
    options: [
      { value: '', label: 'Select investment action...' },
      { value: 'invest', label: 'Invest NOW' },
      { value: 'no', label: 'No' },
      { value: 'hold', label: 'Hold if already bought' },
      { value: 'wait', label: 'Wait for lower price or P/E' },
    ],
    optionStyles: {
      'invest': { backgroundColor: '#d4edda', color: '#155724' },
      'no': { backgroundColor: '#f8d7da', color: '#721c24' },
      'hold': { backgroundColor: '#fff3cd', color: '#856404' },
      'wait': { backgroundColor: '#d1ecf1', color: '#0c5460' },
    },
  },
  {
    key: 'investment_reasoning',
    label: 'Investment Reasoning:',
    type: 'textarea',
    placeholder: 'Enter your investment decision and reasoning...',
    rows: 4,
  },
];


export const investmentService = {

  getInvestmentSummary: async (stockId: number, signal?: AbortSignal): Promise<InvestmentSummary | null> => {
    try {
      const response = await api.get(`/investment_summary/${stockId}`, { signal });
      console.log('Investment summary response data:', response);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  saveInvestmentSummary: async (stockId: number, data: InvestmentSummary, signal?: AbortSignal): Promise<any> => {
    console.log('Saving investment summary:', data);
    const response = await api.post(`/investment_summary/${stockId}`, data, { signal });
    return response.data;
  },
};

export default investmentService;