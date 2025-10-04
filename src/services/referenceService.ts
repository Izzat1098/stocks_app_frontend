import api from './api';
import { Countries, Sectors } from '../types';

export const referenceService = {
  getCountries: async (): Promise<Countries[]> => {
    const response = await api.get('/reference/countries');
    return response.data;
  },

  getSectors: async (): Promise<Sectors[]> => {
    const response = await api.get('/reference/sectors');
    return response.data;
  },
};

export default referenceService;