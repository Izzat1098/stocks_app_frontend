import api from './api';

export interface Exchange {
  id?: number;
  name: string;
  abbreviation: string;
  country: string;
}

export interface ExchangeFormData {
  name: string;
  abbreviation: string;
  country: string;
}

export const exchangeService = {
  // Get all exchanges
  getAll: async (): Promise<Exchange[]> => {
    const response = await api.get('/exchanges');
    return response.data;
  },

  // Get single exchange by ID
  getById: async (id: number): Promise<Exchange> => {
    const response = await api.get(`/exchanges/${id}`);
    return response.data;
  },

  // Create new exchange
  create: async (exchangeData: ExchangeFormData): Promise<Exchange> => {
    const response = await api.post('/exchanges', exchangeData);
    return response.data;
  },

  // Update existing exchange
  update: async (id: number, exchangeData: ExchangeFormData): Promise<Exchange> => {
    const response = await api.put(`/exchanges/${id}`, exchangeData);
    return response.data;
  },

  // Delete exchange
  delete: async (id: number): Promise<void> => {
    await api.delete(`/exchanges/${id}`);
  },
};

export default exchangeService;