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
  stockPrice?: number | null;
  stockPriceFetchedDateTime?: string;
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

export default stockService;