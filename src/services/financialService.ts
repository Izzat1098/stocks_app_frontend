import api from './api';
import { StockPrice } from '../types';

export interface YearlyFinancials {
  sharePrice?: number;
  revenue?: number;
  earnings?: number;
  earningsPerShare?: number;

  profitGross?: number;
  profitBeforeTax?: number;
  profitAfterTax?: number;
  dividendPerShare?: number;

  currCash?: number;
  currInventories?: number;
  currReceivables?: number;
  currOtherAssets?: number;

  nonCurrPropertyPlantEquipment?: number;
  nonCurrIntangibleAssets?: number;
  nonCurrInvestments?: number;
  nonCurrLand?: number;
  nonCurrOtherAssets?: number;

  currBorrowings?: number;
  currPayables?: number;
  currLeaseLiabilities?: number;
  currTaxLiabilities?: number;
  currOtherLiabilities?: number;

  nonCurrBorrowings?: number;
  nonCurrLeaseLiabilities?: number;
  nonCurrTaxLiabilities?: number;
  nonCurrOtherLiabilities?: number;

  equityShareCapital?: number;
  equityRetainedEarnings?: number;
  equityOtherReserves?: number;
  equityNonControllingInterests?: number;

  netCashFromOperatingActivities?: number;
  investmentsInPPE?: number;
  investmentsInSubsidiaries?: number;
  investmentsInAcquisitions?: number;

}

export interface YearlyFinancialsCalculated {
  noShares?: number;
  peRatio?: number;
  profitGrossMargin?: number;
  profitBeforeTaxMargin?: number;
  profitAfterTaxMargin?: number;
  dividendAmount?: number;
  dividendPayoutRatio?: number;

  totalCurrentAssets?: number;
  totalNonCurrentAssets?: number;
  totalAssets?: number;
  totalCurrentLiabilities?: number;
  totalNonCurrentLiabilities?: number;
  totalLiabilities?: number;
  totalEquity?: number;
  totalLiabilitiesAndEquity?: number;
  
  netCash?: number;
  netCurrentAssets?: number;
  netNetCurrentAssets?: number;
  netTangibleAssets?: number;

  ratioDebtToEquity?: number;

  freeCashFlow?: number;
}

export interface FinancialData {
  [year: string]: YearlyFinancials;
}

export interface FinancialDataCalculated {
  [year: string]: YearlyFinancialsCalculated;
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
}

export const mapSnakeToCamel = {
  share_price: 'sharePrice',
  earnings_per_share: 'earningsPerShare',
  // revenue: 'revenue',
  // earnings: 'earnings'
};

export const mapCamelToSnake = {
  sharePrice: 'share_price',
  earningsPerShare: 'earnings_per_share',
  // revenue: 'revenue',
  // earnings: 'earnings'
};

const transformCase = (obj: any, mappedObj: any): any => {
  // Transform the keys from one case to another
  const transformed: any = {};

  for (const key in obj) {
      const newKey = mappedObj[key] || key;
      transformed[newKey] = obj[key];
  }

  return transformed;
};


export const financialService = {

  getFinancialData: async (stockId: number): Promise<FinancialDataWithMeta> => {
    const response = await api.get(`/stocks/${stockId}/financials`);
    const financialData: FinancialDataWithMeta = { stock_id: response.data.stock_id, updated_at: response.data.updated_at, data: {} };

    for (const [year, metrics] of Object.entries(response.data.data)) {
      financialData.data[year] = transformCase(metrics, mapSnakeToCamel);
    };
    return financialData;
  },


  saveFinancialData: async (stockId: number, data: FinancialDataWithMeta): Promise<any> => {
    const financialData: FinancialDataWithMeta = { stock_id: data.stock_id, data: {} };

    for (const [year, metrics] of Object.entries(data.data)) {
      financialData.data[year] = transformCase(metrics, mapCamelToSnake);
    };

    const response = await api.post(`/stocks/${stockId}/financials`, financialData);
    return response.data;
  },
};

export default financialService;



