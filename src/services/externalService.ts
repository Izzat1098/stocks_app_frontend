import axios from 'axios';
import { StockPrice } from '../types';
import { StockData } from './stockService';
import { Exchange } from './exchangeService';

const US_PRICE_URL = 'https://production.dataviz.cnn.io/charting/instruments/latest/report_range/market_status/TICKER/1D/REGULAR';
const MY_PRICE_URL = 'https://stockanalysis.com/api/quotes/a/KLSE-ABBREVIATION'
const US_PRICE_URL2 = 'https://stockanalysis.com/api/quotes/s/TICKER'

// Note: for US stocks, the TICKER format is using alphabets, e.g. AAPL
//       but for MY stocks, the TICKER format is using numbers while ABBREVIATION is using alphabets:
//       e.g. for Time Dotcom: TICKER=5031 & ABBREVIATION=TIMECOM

const createApiInstance = (baseURL: string) => {
  const api = axios.create({
    baseURL: baseURL,
  });

  // Handle errors
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      // Generic error handling for external APIs
      if (error.response) {
        console.error(`API Error: ${error.response.status} - ${error}`);

      } else if (error.request) {
        // No response received
        console.error('No response from external API:', error.request);

      } else {
        // Error setting up the request
        console.error('Error in API request setup:', error.message);
      }
      return Promise.reject(error);
    }
  );
  return api;
};


const usStockPrice = async (stockData: StockData): Promise<number | null> => {
    const ticker = stockData.ticker;
    const base_url = US_PRICE_URL.replace('TICKER', ticker);
    const api = createApiInstance(base_url);

    try {
      const response = await api.get('');
      const data = response.data;
      if (data && data.symbol?.toLowerCase() === ticker.toLowerCase()) {
        return data.current_price ?? null;
      } else return null;

    } catch (error) {
      console.error(`Error fetching US stock for ${ticker}:`, error);
      return null;
    }
};


const myStockPrice = async (stockData: StockData): Promise<number | null> => {
    // const ticker = stockData.ticker;
    const abbreviation = stockData.abbreviation;
    const klseAbbreviation = `KLSE-${abbreviation}`;

    const base_url = MY_PRICE_URL.replace('ABBREVIATION', abbreviation.toUpperCase());
    const api = createApiInstance(base_url);

    try {
      const response = await api.get('');
      const data = response.data.data;
      if (data && data.symbol?.toLowerCase() === klseAbbreviation.toLowerCase()) {
        return data.p ?? null;
      } else return null;

    } catch (error) {
      console.error(`Error fetching MY stock for ${abbreviation}:`, error);
      return null;
    }
};



export const stockPriceService = {
  fetchStockPrice: async (stockData: StockData, exchanges: Exchange[]): Promise<number | null> => {
    const country = stockData.country ? stockData.country.toLowerCase() : '';
    const exchange_id = stockData.exchange_id ? stockData.exchange_id : 0;
    const exchange_name = exchanges.find(ex => ex.id === exchange_id)?.name || '';

    const isUSStock = country === 'united states' ||
      ['nasdaq', 'new york', 'nyse'].some(name => exchange_name.toLowerCase().includes(name));

    const isMYStock = country === 'malaysia' ||
      ['bursa', 'kuala lumpur'].some(name => exchange_name.toLowerCase().includes(name));

    let sharePrice: number | null = null;

    if (isUSStock) {
      sharePrice = await usStockPrice(stockData);

    } else if (isMYStock) {
      sharePrice = await myStockPrice(stockData);

    } else {
      console.warn(`No external price service for country: ${stockData.country} for stock: ${stockData.ticker}`);

    }
    return sharePrice;
  },
};

export default stockPriceService;