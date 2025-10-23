import api from './api';
import transformCase, { FinancialData, FinancialDataWithMeta } from './financialService';

export interface PromptResponse {
  [Qid: string]: string;
}

export const promptService = {
  getAllPrompts: async (): Promise<PromptResponse> => {
    const response = await api.get(`/prompts`);
    return response.data.prompts;
  },

  getAllResponses: async (stockId: number): Promise<PromptResponse> => {
    const response = await api.get(`/prompts/responses/${stockId}`);
    return response.data.prompts;
  },

  generateAIResponse: async (promptId: string, stockId: number, data: FinancialData): Promise<PromptResponse> => {
    const financialData: FinancialDataWithMeta = { stock_id: stockId, data: data };

    // for (const [year, metrics] of Object.entries(data)) {
    //   const transformed: any = {};

    //   for (const key in metrics) {
    //       const newKey = mapCamelToSnake[key as keyof typeof mapCamelToSnake] || key;
    //       transformed[newKey] = (metrics as any)[key];
    //   }
    //   financialData.data[year] = transformed;
    // };

    const response = await api.post(`/prompts/${promptId}`, financialData);
    return response.data.prompts;
  }

};

export default promptService;