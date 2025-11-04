import api from './api';
import financialService, { FinancialDataAll } from './financialService'; 


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

export interface InvestmentSummaryCalculated {
  price_earnings_ratio?: (number | null)[];
  number_of_shares?: (number | null)[];
  average_dividend?: (number | null)[];
  net_profit_margin?: (number | null)[];
  profit_vs_per?: (string | number | null)[];
  profit_div_vs_per?: (string | number | null)[];
}

export interface InvestmentSummaryField {
  key: keyof InvestmentSummary | keyof InvestmentSummaryCalculated;
  label: string;
  title?: string;
  secondary_label?: string;
  type: 'input' | 'select' | 'textarea' | 'calculated' | 'calculated2' | 'date';
  inputType?: 'text' | 'number' | 'date';
  step?: string;
  decimals?: number;
  placeholder?: string;
  rows?: number;
  options?: { value: string; label: string }[];
  optionStyles?: { [value: string]: { backgroundColor: string; color: string } };
  calculate?: (summary: InvestmentSummary, financialDataAll: FinancialDataAll) => Array<string | number | null | undefined>;
  format_primary?: (value: any) => string;
  format_secondary?: (value: any) => string;
}

const getMinMax = (values: (string | number | null | undefined)[]): [number, number] | null => {
  const filtered = values.filter(v => 
    v !== null && 
    v !== undefined &&
    typeof v === 'number' && 
    !isNaN(v)
  ) as number[];

  if (filtered.length === 0) return null;

  return [Math.min(...filtered), Math.max(...filtered)];
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
    key: 'net_profit_margin',
    label: 'Net Profit Margin (%):',
    type: 'calculated',
    format_primary: (value) => value !== null ? `${value.toFixed(2)}%` : '-',
    format_secondary: (value) => value !== null ? `${(value).toFixed(2)}% vs Latest Year` : '-',
  },
  {
    key: 'number_of_shares',
    label: 'Number of Shares:',
    title: 'Too much dilution is bad. Look for stocks with stable or decreasing number of shares over the years.',
    type: 'calculated',
    format_primary: (value) => value !== null ? `${thousandsFormatter(value)}` : '-',
    format_secondary: (value) => value !== null ? `${(value).toFixed(2)}% vs Latest Year` : '-',
  },
  {
    key: 'average_dividend',
    label: 'Average Dividend Yield (%):',
    type: 'calculated',
    format_primary: (value) => value !== null ? `${value.toFixed(2)}%` : '-',
  },
  {
    key: 'price_earnings_ratio',
    label: 'Current Price Earnings Ratio:',
    type: 'calculated',
    format_primary: (value) => value !== null ? value.toFixed(2) : '-',
  },
  {
    key: 'profit_vs_per',
    label: 'Profit Growth Rate (%) vs Price Earnings Ratio:',
    title: 'Profit Growth Rate should be EQUAL OR MORE than PER',
    type: 'calculated',
  },
  {
    key: 'profit_div_vs_per',
    label: 'Long Term Profit Growth Rate & Dividend vs Latest Price Earnings Ratio:',
    title: 'Long Term Profit Growth Rate + Dividend Yield should be EQUAL OR MORE than PER: >1.50 is OK; > 2.0 is GOOD',
    type: 'calculated',
    format_primary: (value) => value !== null ? value.toFixed(2) : '-',
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

const thousandsFormatter = (value: number | null): string => {
  if (value === null) return '-';
  console.log(`Formatting value with thousandsFormatter: ${value}`);
  const formattedValue = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
  console.log(`Formatted value with thousandsFormatter: ${formattedValue}`);
  return formattedValue;
}


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

  calculateMetrics: (summary: InvestmentSummary, data: FinancialDataAll) => {
    const summaryCalculated: InvestmentSummaryCalculated = {};

    summaryCalculated.net_profit_margin = (() => {
      let currentNetMargin = null;
      const revenue = summary.past_4q_revenue;
      const netProfit = summary.past_4q_net_profit;

      if (!revenue || !netProfit || revenue === 0) {
          currentNetMargin = null;
      } else {
          currentNetMargin = (netProfit / revenue) * 100;
      }

      let netMarginIncrease = null;
      const nYears = Object.keys(data).length;
      const lastYearMargin = nYears > 1 
        ? data[Object.keys(data)[nYears - 1]].profit_after_tax_for_shareholders_margin 
        : null;
  
      if (!currentNetMargin || !lastYearMargin || lastYearMargin === 0) {
        netMarginIncrease = null;
      } else {
        netMarginIncrease = 100 * (currentNetMargin - lastYearMargin) / lastYearMargin;
      }

      return [currentNetMargin, netMarginIncrease];
    })();

    summaryCalculated.price_earnings_ratio = (() => {
      const sharePrice = summary.current_share_price;
      const eps = summary.past_4q_earnings_per_share;

      if (!sharePrice || !eps || eps === 0) return [null];

      return [sharePrice / eps];
    })();

    summaryCalculated.number_of_shares = (() => {
      const netProfit = summary.past_4q_net_profit;
      const eps = summary.past_4q_earnings_per_share;

      const numShares = (!netProfit || !eps || eps === 0)
        ? null
        : netProfit / eps;

      let numSharesIncrease = null;
      const nYears = Object.keys(data).length;
      const lastYearShares = nYears > 1 
        ? data[Object.keys(data)[nYears - 1]].number_of_shares 
        : null;

      numSharesIncrease = (!numShares || !lastYearShares || lastYearShares === 0)
        ? null
        : 100 * (numShares - lastYearShares) / lastYearShares;
      return [numShares, numSharesIncrease];
    })();

    summaryCalculated.average_dividend = (() => {
      const years = Object.keys(data).sort();
      if (years.length === 0) return [null];
      let totalDividends = 0;
      let count = 0;
      years.forEach(year => {
        const dividend = data[year]?.dividend_yield;
        if (dividend !== undefined && dividend !== null) {
          totalDividends += dividend;
          count++;
        }
      });
      return count > 0 
        ? [totalDividends / count] 
        : [null];
    })();


    summaryCalculated.profit_vs_per = (() => {
      const years = Object.keys(data).sort();
      const fieldKey = 'profit_after_tax_for_shareholders';
      const profitIncreases: (string | number | null)[] = [];
      const perIncreases: (number | null)[] = [];
      

      years.forEach(year => {
        profitIncreases.push(financialService.calculatePercentageIncrease(year, years, fieldKey, data));
        perIncreases.push(data[year]?.price_earnings_ratio_report_date ?? null);
        perIncreases.push(data[year]?.price_earnings_ratio_max ?? null);
        perIncreases.push(data[year]?.price_earnings_ratio_min ?? null);
      });

      const cagrProfit =
        (typeof profitIncreases[0] === 'string' && profitIncreases[0].toLowerCase().includes('cagr'))
        ? profitIncreases[0] 
        : null;

      const profitMinMax = getMinMax(profitIncreases);
      const perMinMax = getMinMax(perIncreases);

      const returnedProfit = 
        `Profit: ${cagrProfit ? cagrProfit + ' , ' : ''}`
        + `Range (${profitMinMax ? profitMinMax[0].toFixed(1) + '% to ' + profitMinMax[1].toFixed(1) + '%' : ''})`;

      const returnedPER = 
        `PER Range (${perMinMax ? perMinMax[0].toFixed(1) + '% to ' + perMinMax[1].toFixed(1) + '%' : ''})`;

      return [returnedProfit, returnedPER];
    })();

    summaryCalculated.profit_div_vs_per = (() => {
      const years = Object.keys(data).sort();
      const fieldKey = 'profit_after_tax_for_shareholders';
      const profitIncreases: (string | number | null)[] = [];
      let latestPer: number | null = null;
      let ratio: number | null = null;
      let aveDividend: number | null = null;

      let totalDividends = 0;
      let count = 0;

      years.forEach(year => {
        profitIncreases.push(financialService.calculatePercentageIncrease(year, years, fieldKey, data));

        const dividend = data[year]?.dividend_yield;
        if (dividend !== undefined && dividend !== null) {
          totalDividends += dividend;
          count++;
        }
      });

      if (count > 0) {
        aveDividend = totalDividends / count;
      }

      const cagrProfit =
        (typeof profitIncreases[0] === 'string' && profitIncreases[0].toLowerCase().includes('cagr'))
        ? parseFloat(profitIncreases[0].replace(/[^0-9.-]/g, ''))
        : null;

      const sharePrice = summary.current_share_price;
      const eps = summary.past_4q_earnings_per_share;
      if (sharePrice && eps && eps !== 0) {
        latestPer = sharePrice / eps;
      }

      if (cagrProfit !== null && latestPer !== null && latestPer > 0) {
        ratio = (cagrProfit + (aveDividend ?? 0)) / latestPer;
      }

      return [ratio];
    })();

    return summaryCalculated;
  }
};

export default investmentService;