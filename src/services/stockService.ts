import api from './api';
import { StockPrice } from '../types';

// Stock interfaces for the CRUD operations
export interface StockData {
  id?: number;
  ticker: string;
  company_name: string;
  abbreviation: string;
  description: string;
  exchange_id: number | null;
  sector: string;
  country: string;
  ai_description: string;
  stockPrice?: StockPrice;
}

export interface StockFormData {
  ticker: string;
  company_name: string;
  abbreviation: string;
  description: string;
  exchange_id: number | null;
  sector: string;
  country: string;
  ai_description: string;
}

export const stockService = {
  // CRUD operations for stocks
  getAll: async (): Promise<StockData[]> => {
    const response = await api.get('/stocks');
    return response.data;
  },

  getById: async (id: number): Promise<StockData> => {
    const response = await api.get(`/stocks/${id}`);
    return response.data;
  },

  create: async (stockData: StockFormData): Promise<StockData> => {
    const response = await api.post('/stocks', stockData);
    return response.data;
  },

  update: async (id: number, stockData: StockFormData): Promise<StockData> => {
    const response = await api.put(`/stocks/${id}`, stockData);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/stocks/${id}`);
  },
};
  // Legacy methods (keeping for backward compatibility)
  // getStocks: async (): Promise<Stock[]> => {
  //   const response = await api.get('/stocks');
  //   return response.data;
  // },

  // getStock: async (symbol: string): Promise<Stock> => {
  //   const response = await api.get(`/stocks/${symbol}`);
  //   return response.data;
  // },

  // getHoldings: async (): Promise<Holding[]> => {
  //   const response = await api.get('/holdings');
  //   return response.data;
  // },

  // addHolding: async (holding: {
  //   stock_symbol: string;
  //   shares: number;
  //   purchase_price: number;
  // }): Promise<Holding> => {
  //   const response = await api.post('/holdings', holding);
  //   return response.data;
  // },

  // updateHolding: async (id: number, holding: {
  //   shares?: number;
  //   purchase_price?: number;
  // }): Promise<Holding> => {
  //   const response = await api.put(`/holdings/${id}`, holding);
  //   return response.data;
  // },

  // deleteHolding: async (id: number): Promise<void> => {
  //   await api.delete(`/holdings/${id}`);
  // },


export default stockService;