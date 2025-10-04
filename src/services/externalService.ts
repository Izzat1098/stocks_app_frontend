import axios from 'axios';
import { StockPrice } from '../types';
import { StockData } from './stockService';

const US_PRICE_URL = 'https://production.dataviz.cnn.io/charting/instruments/latest/report_range/market_status/TICKER/1D/REGULAR';
const MY_PRICE_URL = 'https://stockanalysis.com/api/quotes/a/KLSE-ABBREVIATION'
const US_PRICE_URL2 = 'https://stockanalysis.com/api/quotes/s/TICKER'

// Note: for US stocks, the TICKER format is using alphabets, e.g. AAPL
//       but for MY stocks, the TICKER format is using numbers while ABBREVIATION is using alphabets:
//       e.g. for Time Dotcom: TICKER=5031 & ABBREVIATION=TIMECOM

const createApiInstance = (baseURL: string) => {
  const api = axios.create({
    baseURL: baseURL,
    // headers: {
    //   'Content-Type': 'application/json',
    // },
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


const usStockPrice = async (stockPrice: StockPrice): Promise<StockPrice> => {
    const base_url = US_PRICE_URL.replace('TICKER', stockPrice.ticker);
    const api = createApiInstance(base_url);
    const response = await api.get('');

    const data = response.data;
    if (data && data.symbol?.toLowerCase() === stockPrice.ticker.toLowerCase()) {
      // below are specific to the API response structure. change if the API changes
      stockPrice.currentPrice = response.data.current_price || null;
      stockPrice.fetchedDateTime = new Date().toISOString();
    }
    // console.log(`US stock price fetched for ticker ${stockPrice.ticker}: `, stockPrice);
    return stockPrice;
};


const myStockPrice = async (stockPrice: StockPrice): Promise<StockPrice> => {
    const base_url = MY_PRICE_URL.replace('ABBREVIATION', stockPrice.abbreviation.toUpperCase());
    const api = createApiInstance(base_url);
    const response = await api.get('');
    const klseAbbreviation = `KLSE-${stockPrice.abbreviation}`;

    const data = response.data.data;

    if (data && data.symbol?.toLowerCase() === klseAbbreviation.toLowerCase()) {
      // below are specific to the API response structure. change if the API changes
      stockPrice.currentPrice = data.p || null;
      stockPrice.fetchedDateTime = new Date().toISOString();
    }
    // console.log(`MY stock price fetched for abbreviation ${stockPrice.abbreviation}: `, stockPrice);
    return stockPrice;
};



export const stockPriceService = {
  fetchStockPrice: async (stockData: StockData): Promise<StockData> => {
    if (!stockData.stockPrice || !stockData.stockPrice.fetchedDateTime) {
      // Handle missing stockPrice or fetchedDateTime
      stockData.stockPrice = {
        ticker: stockData.ticker,
        abbreviation: stockData.abbreviation,
        currentPrice: 0,
        fetchedDateTime: new Date(0).toISOString(),
      };
    }

    if (stockData.country.toLowerCase() === 'united states') {
      stockData.stockPrice = await usStockPrice(stockData.stockPrice);
      return stockData;

    } else if (stockData.country.toLowerCase() === 'malaysia') {
      stockData.stockPrice = await myStockPrice(stockData.stockPrice);
      return stockData;
      
    } else {
      console.warn(`No external price service for country: ${stockData.country}`);
      return stockData;
    }
  },
};

export default stockPriceService;