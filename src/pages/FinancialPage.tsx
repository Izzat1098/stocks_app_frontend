import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { stockService, StockData } from '../services/stockService';
import financialService, { FinancialData, FinancialDataAll, FinancialDataCalculated, FinancialDataWithMeta, FinancialMetric, YearlyFinancials, YearlyFinancialsCalculated } from '../services/financialService';
import investmentService, { InvestmentSummary, InvestmentSummaryCalculated, InvestmentSummaryField, investmentSummaryFields } from '../services/investmentService';
import promptService, { PromptResponse } from '../services/promptService';
import { format } from 'path';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);


const FinancialPage: React.FC = () => {
  const location = useLocation();
  const pasteOccurredRef = useRef<{[key: string]: boolean}>({});
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [selectedStockId, setSelectedStockId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [years, setYears] = useState<string[]>([]);
  const [newYear, setNewYear] = useState<string>('');
  const [financialData, setFinancialData] = useState<FinancialData>({});
  const [financialDataCalculated, setFinancialDataCalculated] = useState<FinancialDataCalculated>({});
  const [financialDataAll, setFinancialDataAll] = useState<FinancialDataAll>({});
  const [editingYear, setEditingYear] = useState<string | null>(null);
  const [tempYearValue, setTempYearValue] = useState<string>('');
  const [showPasteInstructions, setShowPasteInstructions] = useState<boolean>(false);
  const [inputValues, setInputValues] = useState<{[key: string]: string}>({});
  const [errorForm, setErrorForm] = useState<string>('');
  const [originalFinancialData, setOriginalFinancialData] = useState<FinancialData>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [aiPrompts, setAiPrompts] = useState<PromptResponse>({});
  const [aiResponses, setAiResponses] = useState<PromptResponse>({});
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [generatingResponse, setGeneratingResponse] = useState<string | null>(null);
  
  // Investment Summary state
  const [investmentSummary, setInvestmentSummary] = useState<InvestmentSummary>({});
  const [originalInvestmentSummary, setOriginalInvestmentSummary] = useState<InvestmentSummary>({});
  const [hasUnsavedSummaryChanges, setHasUnsavedSummaryChanges] = useState(false);
  const [investInputValues, setInvestInputValues] = useState<{[key: string]: string}>({});
  const [investmentSummaryCalculated, setInvestmentSummaryCalculated] = useState<InvestmentSummaryCalculated>({});

  // Collapsible sections state
  const [showCharts, setShowCharts] = useState(true);
  const [showInvestmentSummary, setShowInvestmentSummary] = useState(true);
  const [showFinancialData, setShowFinancialData] = useState(true);
  const [showAiQueries, setShowAiQueries] = useState(true);

  const DEFAULT_UNIT = '$';
  const DEFAULT_DECIMALS = 0;

  // Only define custom settings for specific metrics
  const metricOverrides: Partial<Record<keyof YearlyFinancials | keyof YearlyFinancialsCalculated | any, Partial<FinancialMetric>>> = {
    // per shares
    share_price_at_report_date: { decimals: 2 },
    max_share_price: { decimals: 2 },
    min_share_price: { decimals: 2 },
    average_share_price: { decimals: 2 },
    number_of_shares: {unit: '' , hoverText: 'Calculated as: Profit After Tax For Shareholders / Earnings per Share' },
    // Price/Earnings Ratios
    price_earnings_ratio_report_date: { unit: ''},
    price_earnings_ratio_max: { unit: ''},
    price_earnings_ratio_min: { unit: ''},
    // profit loss
    gross_margin: { unit: '%', decimals: 1 },
    profit_before_tax_margin: { unit: '%', decimals: 1 },
    profit_after_tax_for_shareholders_margin: { unit: '%', decimals: 1 },
    earnings_per_share: { decimals: 2 },
    // asset metrics
    net_cash: { hoverText: 'Calculated as: Cash - Total Current Liabilities' },
    net_net_cash: { hoverText: 'Calculated as: Cash - Total Liabilities' },
    net_current_assets: { hoverText: 'Calculated as: Total Current Assets - Total Current Liabilities' },
    net_net_current_assets: { hoverText: 'Calculated as: Total Current Assets - Total Liabilities' },
    net_tangible_assets: { hoverText: 'Calculated as: Total Assets - Intangible Assets - Total Liabilities - Non Controlling Interests' },
    // others
    dividend_per_share: { decimals: 2 },
    dividend_yield: { unit: '%', decimals: 1, hoverText: 'Calculated as: Dividend per Share / Average Share Price' },
    dividend_payout_ratio: { unit: '', decimals: 1, hoverText: 'Calculated as: Dividend per Share / Earnings per Share' },
    debt_to_equity_ratio: { unit: '', decimals: 1, hoverText: 'Calculated as: Total Liabilities / Total Equity'  },
    free_cash_flow: { hoverText: 'Calculated as: Net Cash from Operating Activities - Investments in PPE' },
    // All others will use defaults
  };


  const keyToLabel = (input: string): string => {
    return input
      .replace(/_/g, ' ')                                // Replace underscores with spaces
      .split(' ')                                        // Split into words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize each word
      .join(' ');                                        // Join back with spaces
  };


  const orderedKeysWithSeparators: (keyof YearlyFinancials | keyof YearlyFinancialsCalculated | any)[] = [
    'separator-Share_Prices',
    'share_price_at_report_date',
    'max_share_price',
    'min_share_price',
    'average_share_price',
    'number_of_shares',
    'price_earnings_ratio_report_date',
    'price_earnings_ratio_max',
    'price_earnings_ratio_min',
    'separator-Profit_&_Loss',
    'revenue',
    'gross_profit',
    'gross_margin',
    'profit_before_tax',
    'profit_before_tax_margin',
    'profit_after_tax',
    'profit_after_tax_for_shareholders',
    'profit_after_tax_for_shareholders_margin',
    'earnings_per_share',
    'dividend_per_share',
    'dividend_amount',
    'dividend_payout_ratio',
    'dividend_yield',
    'separator-Current_Assets',
    'cash',
    'inventories',
    'receivables',
    'investments_in_securities',
    'other_current_assets',
    'total_current_assets',
    'separator-Non-Current_Assets',
    'property_plant_equipment',
    'land_and_real_estate',
    'investments_subsidiaries',
    'intangible_assets',
    'non_current_investments',
    'other_non_current_assets',
    'total_non_current_assets',
    'total_assets',
    'separator-Current_Liabilities',
    'borrowings',
    'payables',
    'lease_liabilities',
    'tax_liabilities',
    'other_current_liabilities',
    'total_current_liabilities',
    'separator-Non-Current_Liabilities',
    'long_term_debts',
    'long_term_lease_liabilities',
    'deferred_tax_liabilities',
    'other_non_current_liabilities',
    'total_non_current_liabilities',
    'total_liabilities',
    'separator-Asset_Metrics',
    'net_cash',
    'net_net_cash',
    'net_current_assets',
    'net_net_current_assets',
    'net_tangible_assets',
    'debt_to_equity_ratio',
    'separator-Equities',
    'share_capital',
    'retained_earnings',
    'reserves',
    'equity_attributable_to_shareholders',
    'non_controlling_interests',
    'total_equity',
    'total_liabilities_and_equity',
    'separator-Cash_Flows',
    'net_cash_from_operating_activities',
    'investments_in_ppe',
    'investments_in_subsidiaries',
    'investments_in_acquisitions',
    'free_cash_flow',
    'separator-YOY_and_CAGR_Increases'
  ];


  // Auto-generate metrics from defined keys above
  const getMetrics = (): FinancialMetric[] => {
    return orderedKeysWithSeparators
      .filter(key => !key.toLowerCase().includes('separator')) // Exclude keys containing 'separator'
      .map(key => ({
        key,
        label: keyToLabel(key),
        unit: metricOverrides[key]?.unit ?? DEFAULT_UNIT,
        decimals: metricOverrides[key]?.decimals ?? DEFAULT_DECIMALS,
        hoverText: metricOverrides[key]?.hoverText ?? '',
    }));

  };

  const metrics = getMetrics();

  const fieldsForIncreasesCalc: (keyof YearlyFinancials | keyof YearlyFinancialsCalculated | any)[] = [
    'average_share_price',
    'number_of_shares',
    'revenue',
    'profit_after_tax_for_shareholders',
    'earnings_per_share',
    'dividend_per_share',
    'cash',
    'total_current_assets',
    'total_non_current_assets',
    'total_assets',
    'borrowings',
    'total_current_liabilities',
    'total_non_current_liabilities',
    'total_liabilities',
    'net_tangible_assets',
    'equity_attributable_to_shareholders',
    'total_equity',
    'net_cash_from_operating_activities',
    'free_cash_flow',
  ];

  // Format number with commas and decimals
  const formatNumber = (value: number, decimals = 0): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  // Format short number with K, M, B suffixes
  const formatShortNumber = (value: number, decimals = 0): string => {
    if (value === null || value === undefined) return '';

    const absValue = Math.abs(value);
    let formattedValue = '';
    let suffix = '';

    if (absValue >= 1_000_000_000) {
      formattedValue = (value / 1_000_000_000).toFixed(decimals);
      suffix = 'B';
    } else if (absValue >= 1_000_000) {
      formattedValue = (value / 1_000_000).toFixed(decimals);
      suffix = 'M';
    } else if (absValue >= 1_000) {
      formattedValue = (value / 1_000).toFixed(decimals);
      suffix = 'K';
    } else {
      formattedValue = value.toFixed(decimals);
    }

    return `${formattedValue}${suffix}`;
  };

  // Parse formatted number back to number
  const parseFormattedNumber = (value: string): number => {
    // Remove currency codes, symbols, and unwanted characters
    const cleaned = value
      .replace(/[A-Z]{2,3}/gi, '')  // Remove currency codes (USD, RM, EUR, etc.)
      .replace(/[$€£¥₹]/g, '')      // Remove common currency symbols
      .replace(/[^\d.kmb,-]/gi, '')  // Keep only digits, dots, k/m/b, commas, minus
      .replace(/,/g, '')            // Remove thousand separators
      .trim()
      .toLowerCase();
    
    // Handle abbreviations (k, m, b)
    const suffixMatch = cleaned.match(/([kmb])$/);
    
    if (suffixMatch) {
      const baseNumber = parseFloat(cleaned.slice(0, -1));
      const multipliers: Record<string, number> = { 
        k: 1000, 
        m: 1000000, 
        b: 1000000000 
      };
      return baseNumber * (multipliers[suffixMatch[1]] || 1);
    }
    
    return parseFloat(cleaned) || 0;
  };

  // Format year for display (show just the year)
  const formatYearForDisplay = (dateString: string): string => {
    return dateString.split('-')[0];
  };


  // Fetch stocks on component mount
  useEffect(() => {
    const fetchStocks = async () => {

      try {
        setLoading(true);
        const stocksData = await stockService.getAll();
        setStocks(stocksData);

        // Check if stockId was passed via navigation
        const navigationState = location.state as { stockId?: number } | null;
        if (navigationState?.stockId) {
          setSelectedStockId(navigationState.stockId);
        } else if (stocksData.length > 0) {
          setSelectedStockId(stocksData[0].id || null);
        }

      } catch (error) {
        console.error('Failed to fetch stocks:', error);

      } finally {
        setLoading(false);
      }
    };
    fetchStocks();
  }, [location]);


  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchFinancialData = async () => {
      if (!selectedStockId) return;

      try {
        //  fetch financial data from API/DB
        const data = await financialService.getFinancialData(selectedStockId, controller.signal);
        // console.log('Fetched financial data:', data);
        
        if (isMounted && data) {
          // calculate derived metrics from fetched data
          const calculatedMetrics: FinancialDataCalculated = financialService.calculateMetrics(data.data);

          // merge data
          const mergedData: FinancialDataAll = {};
          Object.keys(data.data).forEach(year => {
            mergedData[year] = {
              ...data.data[year],
              ...calculatedMetrics[year]
            };
          });

          // update states
          // console.log('setFinancialData inside useEffect348:', data.data);
          setFinancialData(data.data);
          // console.log('financialData fetched:', data.data);
          // console.log('type of financialData:', typeof(financialData));
          // console.log('financialData : ', financialData);
          setFinancialDataCalculated(calculatedMetrics);
          setFinancialDataAll(mergedData);
          setOriginalFinancialData(JSON.parse(JSON.stringify(data.data))); // Deep copy

          const fetchedYears = Object.keys(data.data).sort();
          setYears(fetchedYears);
          setHasUnsavedChanges(false);
          setErrorForm('');
        } else {
          console.log('No financial data found for this stock, starting fresh');
          // console.log('type of financialData:', typeof(financialData));
          // console.log('financialData : ', financialData);
        }

      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('Fetch aborted');
          return;
        }

        if (isMounted) {
          if (error.response?.status === 404) {
            console.log('No financial data found for this stock, starting fresh');
            setErrorForm('No financial data found for this stock. You can start entering data.');
          } else {
            console.error('Error fetching financial data:', error);
            setErrorForm('Error fetching financial data. Please try again.');
          }
          initStartingData();
        }
      }
    };

    const fetchAiPrompts = async () => {
      setLoadingPrompts(true);
      try {
        const prompts = await promptService.getAllPrompts( );
        // console.log('Fetched AI prompts for stock:', prompts);
        if (prompts) {
          setAiPrompts(prompts);
        }

        if (selectedStockId) {
          const responses = await promptService.getAllResponses(selectedStockId);
          if (responses) {
            // console.log('Fetched AI responses for stock:', responses);
            setAiResponses(responses);
          }
        }
        
      } catch (error) {
        console.error('Error fetching AI prompts:', error);
        setAiPrompts({});
        setAiResponses({});

      } finally {
        setLoadingPrompts(false);
      }
    };

    const fetchInvestmentSummary = async () => {
      if (!selectedStockId) return;
      console.log('fetchInvestmentSummary called');
      try {
        const summary = await investmentService.getInvestmentSummary(selectedStockId, controller.signal);
        console.log('Fetched investment summary:', summary);
        if (isMounted && summary) {
          setInvestmentSummary(summary);
          setInvestmentSummaryCalculated(investmentService.calculateMetrics(summary, financialDataAll));
          setOriginalInvestmentSummary(JSON.parse(JSON.stringify(summary)));
          setHasUnsavedSummaryChanges(false);

        } else if (isMounted) {
          // No summary found, initialize empty
          setInvestmentSummary({});
          setInvestmentSummaryCalculated({});
          setOriginalInvestmentSummary({});
          setHasUnsavedSummaryChanges(false);
        }

      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('Fetch investment summary aborted');
          return;
        }
        console.error('Error fetching investment summary:', error);
        if (isMounted) {
          setInvestmentSummary({});
          setInvestmentSummaryCalculated({});
          setOriginalInvestmentSummary({});
        }
      }
    };

    fetchFinancialData();
    fetchAiPrompts();
    fetchInvestmentSummary();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [selectedStockId]);

  // Detect changes in financial data
  useEffect(() => {
    const hasChanges = JSON.stringify(financialData) !== JSON.stringify(originalFinancialData);
    setHasUnsavedChanges(hasChanges);
  }, [financialData, originalFinancialData]);

  // Detect changes in investment summary
  useEffect(() => {
    const hasChanges = JSON.stringify(investmentSummary) !== JSON.stringify(originalInvestmentSummary);
    setHasUnsavedSummaryChanges(hasChanges);
  }, [investmentSummary, originalInvestmentSummary]);

  // format investment summary action
  useEffect(() => {
    investmentSummaryFields.map((field, index) => {
      if (field.type === 'select') {
        const fieldKey = field.key as keyof InvestmentSummary; 
        updateSelectStyle(fieldKey, index, `select-${fieldKey}`);
      }
    }); 

    setInvestmentSummaryCalculated(investmentService.calculateMetrics(investmentSummary, financialDataAll));

  }, [investmentSummary]);

  // Recalculate when financialData changes (user edits)
  useEffect(() => {
    if (!selectedStockId) return;

    const calculatedMetrics = financialService.calculateMetrics(financialData);
    setFinancialDataCalculated(calculatedMetrics);

    const mergedData: FinancialDataAll = {};
    Object.keys(financialData).forEach(year => {
      mergedData[year] = {
        ...financialData[year],
        ...calculatedMetrics[year]
      };
    });

    setFinancialDataAll(mergedData);
  }, [financialData, selectedStockId]);

  const selectedStock = stocks.find(stock => stock.id === selectedStockId);
  
  // Handle stock selection change
  const handleStockChange = (stockId: number) => {
    // Clear previous data immediately
    // console.log('setFinancialData to empty in handleStockChange')
    setFinancialData({});
    setYears([]);
    setInputValues({});
    setInvestmentSummary({});

    if (stockId === selectedStockId) {
      // If selecting the same stock, force a refresh
      setSelectedStockId(null); // Temporarily clear
      setTimeout(() => setSelectedStockId(stockId), 0); // Re-set to trigger useEffect

    } else {
      setSelectedStockId(stockId);
    }
  };


  // Handle paste event for bulk data input
  const handlePaste = async (event: React.ClipboardEvent, year: string, metricKey: keyof FinancialData[string]) => {
    console.log('Pasting data for year:', year, 'and metricKey:', metricKey);
    event.preventDefault();
    
    // Set flag to prevent blur handler
    const inputKey = `${year}-${metricKey}`;
    pasteOccurredRef.current[inputKey] = true;
    
    const pasteData = event.clipboardData.getData('text');
    // console.log('Pasted data:', pasteData);
    const lines = pasteData.trim().split('\n');
    // console.log('Lines from pasted data:', lines);

    const metricIndex = metrics.findIndex(m => m.key === metricKey);
    if (metricIndex < 0) return; // Invalid metricKey
    
    // If pasting multiple lines, try to map them to metrics
    if (lines.length > 1) {
      console.log('pasting multiple lines: ', lines.length);
      const updatedData = { ...financialData };
      // console.log(`original data: `, updatedData);
      
      // lines.forEach((line, lineIndex) => {
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        const metricLineIndex = lineIndex + metricIndex;
        const metric = metrics[metricLineIndex];
        if (!metric) break;

        const isCalculated = metric.key in ({} as YearlyFinancialsCalculated);
        if (isCalculated) break; // Skip read-only fields

        const value = parseFormattedNumber(line.trim());
        if (value) {
          if (!updatedData[year]) {
            updatedData[year] = {};
          }
          const metricKey = metric.key as keyof YearlyFinancials;
          updatedData[year][metricKey] = value;
        }
      }
      // console.log('setFinancialData inside handlePaste:', updatedData);
      setFinancialData(updatedData);

    } else {
      // Single value paste
      console.log('pasting single value of: ', pasteData);
      const value = parseFormattedNumber(pasteData.trim());
      // console.log('parsed single value: ', value);
      // console.log(`year: ${year}, metricKey: ${metricKey}`);
      // console.log(`line569 updateFinancialData from handlePaste for year ${year}, metric ${metricKey}:`, value);
      updateFinancialData(year, metricKey, value);
    }
    
    // Clear the input value so it shows the formatted version
    setInputValues(prev => {
      const updated = { ...prev };
      delete updated[inputKey];
      return updated;
    });
    
    // Reset the flag after a short delay
    setTimeout(() => {
      pasteOccurredRef.current[inputKey] = false;
    }, 100);
  };


  // Handle paste for entire row (metric across all years)
  const handleRowPaste = async (event: React.ClipboardEvent, metricKey: keyof FinancialData[string]) => {
    event.preventDefault();
    
    const pasteData = event.clipboardData.getData('text');
    const values = pasteData.trim().split(/[\t\n]+/); // Split by tab, newline, or comma
    const updatedData = { ...financialData };
    
    // Map values to years in order
    values.forEach((value, index) => {
      const numericValue = parseFormattedNumber(value.trim());
      if (numericValue && years[index]) {
        const year = years[index];
        if (!updatedData[year]) {
          updatedData[year] = {};
        }
        updatedData[year][metricKey] = numericValue;
      }
    });
    
    setFinancialData(updatedData);
  };

  // Handle paste event for investment summary
  const handlePasteInvestmentSummary = async (event: React.ClipboardEvent, key: keyof InvestmentSummary) => {
    event.preventDefault();
    
    const pasteData = event.clipboardData.getData('text');
    const lines = pasteData.trim().split('\n');

    // Single value paste
    const value = parseFormattedNumber(lines[0].trim());

    updateInvestmentSummary(key, value)
  };

  // Save financial data
  const handleSave = async () => {
    if (!selectedStock || !selectedStockId) {
      alert('Please select a stock first');
      return;
    }

    try {
      const financialDataToSave: FinancialDataWithMeta = {
        data: financialData,
        stock_id: selectedStockId,
      };
      // console.log('Saving financial data:', financialDataToSave);
      console.log('Saving financial data for stock id:', selectedStockId);
      await financialService.saveFinancialData(selectedStockId, financialDataToSave);
      
      // Update original data to reflect saved state
      setOriginalFinancialData(JSON.parse(JSON.stringify(financialData)));
      setHasUnsavedChanges(false);
      
    } catch (error) {
      console.error('Failed to save financial data:', error);
      alert('Failed to save financial data. Please try again.');
    }
  };

  // Save investment summary
  const handleSaveInvestmentSummary = async () => {
    if (!selectedStockId) {
      // alert('Please select a stock first');
      return;
    }

    try {
      await investmentService.saveInvestmentSummary(selectedStockId, investmentSummary);
      
      // Update original data to reflect saved state
      setOriginalInvestmentSummary(JSON.parse(JSON.stringify(investmentSummary)));
      setHasUnsavedSummaryChanges(false);
      
    } catch (error) {
      console.error('Failed to save investment summary:', error);
      alert('Failed to save investment summary. Please try again.');
    }
  };

  // Update investment summary field
  const updateInvestmentSummary = (field: keyof InvestmentSummary, value: any) => {
    setInvestmentSummary(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Update select style
  const updateSelectStyle = (fieldKey: keyof InvestmentSummary, fieldIndex: number, id: string, reset?: boolean) => {
    const selectElement = document.getElementById(id) as HTMLSelectElement | null;
    if (!selectElement) return;

    const field = investmentSummaryFields[fieldIndex];
    if (!field) return;

    if (reset) {
      selectElement.style.backgroundColor = '';
      selectElement.style.color = '';
      selectElement.style.fontWeight = '';
      return;
    }
    const value = investmentSummary[fieldKey] ?? '';
    const styles = field.optionStyles?.[value];

    if (styles){
      selectElement.style.backgroundColor = styles.backgroundColor ?? '';
      selectElement.style.color = styles.color ?? '';
      selectElement.style.fontWeight = 'bold';
    }
  }

  const handleGenerateAIResponse = async (promptId: string) => {
    if (!selectedStockId) return;

    setGeneratingResponse(promptId);
    try {
      console.log('Generating AI response for prompt:', promptId, 'for stock id:', selectedStockId);
      const response = await promptService.generateAIResponse(promptId, selectedStockId, financialData);
      console.log('AI response generated received:', response);

      // Update the specific prompt's response
      setAiResponses(prevResponses => ({
        ...prevResponses,
        [promptId]: response[promptId]
      }));

    } catch (error) {
      console.error('Error generating AI response:', error);
      // alert('Failed to generate AI response. Please try again.');

    } finally {
      setGeneratingResponse(null);
    }
  };

  const handleGenerateAllResponses = async () => {
    if (!selectedStockId) return;

    // Get all prompt IDs that don't have responses yet
    const promptsWithoutResponses = Object.keys(aiPrompts).filter(
      promptId => !aiResponses[promptId]
    );

    if (promptsWithoutResponses.length === 0) {
      alert('All prompts already have responses!');
      return;
    }

    // Generate responses one by one by calling the single handler
    for (const promptId of promptsWithoutResponses) {
      await handleGenerateAIResponse(promptId);
    }
  };

  const initStartingData = () => {
    setYears(['2021-12-31', '2022-12-31', '2023-12-31', '2024-12-31']);
    setFinancialData({
      '2021-12-31': { },
      '2022-12-31': { },
      '2023-12-31': { },
      '2024-12-31': { },
    });
  };


  // Add new year column
  const addYear = () => {
    if (newYear && !years.includes(newYear)) {
      const updatedYears = [...years, newYear].sort();
      setYears(updatedYears);
      setFinancialData(prev => ({
        ...prev,
        [newYear]: {}
      }));
      setNewYear('');
    }
  };

  // Remove year column
  const removeYear = (yearToRemove: string) => {
    setYears(prev => prev.filter(year => year !== yearToRemove));
    setFinancialData(prev => {
      const updated = { ...prev };
      delete updated[yearToRemove];
      return updated;
    });
  };

  // Update financial data
  const updateFinancialData = (year: string, metric: keyof FinancialData[string], value: number) => {
    // console.log(`Updating financial data for year ${year}, metric ${metric}, value ${value} by updateFinancialData`);
    setFinancialData(prev => ({
      ...prev,
      [year]: {
        ...prev[year],
        [metric]: value
      }
    }));
    // console.log('Updated financialData line 774:', financialData);
  };

  // Start editing a year
  const startEditingYear = (year: string) => {
    setEditingYear(year);
    setTempYearValue(year);
  };

  // Cancel year editing
  const cancelYearEdit = () => {
    setEditingYear(null);
    setTempYearValue('');
  };

  // Save year edit
  const saveYearEdit = () => {
    if (editingYear && tempYearValue.trim() && tempYearValue !== editingYear) {
      // Update years array
      const updatedYears = years.map(year => 
        year === editingYear ? tempYearValue.trim() : year
      );
      setYears(updatedYears);

      // Update financial data with new year key
      const updatedFinancialData = { ...financialData };
      if (financialData[editingYear]) {
        updatedFinancialData[tempYearValue.trim()] = financialData[editingYear];
        delete updatedFinancialData[editingYear];
      }
      // console.log('Updated financialData after saving year edit:', updatedFinancialData);
      setFinancialData(updatedFinancialData);
    }
    
    setEditingYear(null);
    setTempYearValue('');
  };

  // Handle year input key press
  const handleYearKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveYearEdit();
    } else if (e.key === 'Escape') {
      cancelYearEdit();
    }
  };

  // Handle input focus - store raw value for editing
  const handleInputFocus = (year: string, metricKey: keyof FinancialData[string]) => {
    const inputKey = `${year}-${metricKey}`;
    const currentValue = financialData[year]?.[metricKey];
    if (currentValue !== undefined && currentValue !== null) {
      setInputValues(prev => ({
        ...prev,
        [inputKey]: currentValue.toString()
      }));
    }
  };

  // Handle input blur - format the value
  const handleInputBlur = (year: string, metricKey: keyof FinancialData[string]) => {
    const inputKey = `${year}-${metricKey}`;
    
    // Skip if paste just occurred
    if (pasteOccurredRef.current[inputKey]) {
      // console.log('Skipping blur handler - paste just occurred');
      return;
    }
    
    const rawValue = inputValues[inputKey];
    if (rawValue !== undefined) {
      const numericValue = parseFormattedNumber(rawValue);
      // console.log(`line839 updateFinancialData from handleInputBlur for year ${year}, metric ${metricKey}:`, numericValue);
      updateFinancialData(year, metricKey, numericValue);
      // Clear from inputValues to show formatted version
      setInputValues(prev => {
        const updated = { ...prev };
        delete updated[inputKey];
        return updated;
      });
    }
  };

  // Handle input change during editing
  const handleInputChange = (year: string, metricKey: keyof FinancialData[string], value: string) => {
    const inputKey = `${year}-${metricKey}`;
    setInputValues(prev => ({
      ...prev,
      [inputKey]: value
    }));
  };

  // Handle Enter key navigation
  const handleKeyDown = (e: React.KeyboardEvent, year: string, metricKey: keyof FinancialData[string]) => {
    const currentMetricIndex = metrics.findIndex(m => m.key === metricKey);

    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
    
      // Move to below row (next metric)
      if (currentMetricIndex < metrics.length - 1) {
        const nextMetric = metrics[currentMetricIndex + 1];
        const nextInputId = `input-${year}-${nextMetric.key}`;
        const nextInput = document.getElementById(nextInputId);
        if (nextInput) {
          nextInput?.focus();
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();

      // Move to above row (previous metric)
      if (currentMetricIndex > 0) {
        const prevMetric = metrics[currentMetricIndex - 1];
        const prevInputId = `input-${year}-${prevMetric.key}`;
        const prevInput = document.getElementById(prevInputId);
        if (prevInput) {
          prevInput?.focus();
        }
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      // Move to next year column
      const currentYearIndex = years.indexOf(year);
      if (currentYearIndex < years.length - 1) {
        const nextYear = years[currentYearIndex + 1];
        const nextInputId = `input-${nextYear}-${metricKey}`;
        const nextInput = document.getElementById(nextInputId);
        if (nextInput) {
          nextInput?.focus();
        }
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      // Move to previous year column
      const currentYearIndex = years.indexOf(year);
      if (currentYearIndex > 0) {
        const prevYear = years[currentYearIndex - 1];
        const prevInputId = `input-${prevYear}-${metricKey}`;
        const prevInput = document.getElementById(prevInputId);
        if (prevInput) {
          prevInput?.focus();
        }
      }
    }
  };


  // Combined chart data with dual Y-axes
  const combinedChartData = {
    // labels: years.map(year => formatYearForDisplay(year)),
    labels: years,
    datasets: [
      {
        label: 'Share Price ($)',
        data: years.map(year => financialData[year]?.share_price_at_report_date || 0),
        borderColor: 'darkolivegreen',
        backgroundColor: 'darkolivegreen',
        yAxisID: 'y',
        borderWidth: 2,
        pointStyle: 'circle',
        pointRadius: 3,
      },
      {
        label: 'Earnings Per Share ($)',
        data: years.map(year => financialData[year]?.earnings_per_share || 0),
        borderColor: 'deeppink',
        backgroundColor: 'deeppink',
        yAxisID: 'y',
        borderWidth: 2,
        pointStyle: 'circle',
        pointRadius: 3,
      },
      {
        label: 'Revenue ($)',
        data: years.map(year => financialData[year]?.revenue || 0),
        borderColor: 'dodgerblue',
        backgroundColor: 'dodgerblue',
        yAxisID: 'y1',
        borderWidth: 2,
        pointStyle: 'circle',
        pointRadius: 3,
      },
      {
        label: 'Earnings ($)',
        data: years.map(year => financialData[year]?.profit_after_tax_for_shareholders || 0),
        borderColor: 'goldenrod',
        backgroundColor: 'goldenrod',
        yAxisID: 'y1',
        borderWidth: 2,
        pointStyle: 'circle',
        pointRadius: 3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: `Financial Results for ${selectedStock ? selectedStock.company_name : ''}`,
        color: 'black',
        font: {
          size: 16,
          weight: 'normal' as const,
          family: 'Roboto',
        },
      },
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 5,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            
            // Format based on the metric type
            if (label.includes('Revenue') || label.includes('Earnings')) {
              return `${label}: $${formatNumber(value, 0)}`;
            } else {
              return `${label}: $${formatNumber(value, 2)}`;
            }
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Financial Year End',
          color: 'black',
          font: {
            size: 14,
            weight: 'normal' as const,
            family: 'Roboto',
          },
        },
        grid: {
          color: 'lightgray',
        },
        ticks: {
          color: 'darkslategray',
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        beginAtZero: true,
        title: {
          display: true,
          text: 'Share Price & EPS ($)',
          font: {
            size: 14,
            weight: 'normal' as const,
            family: 'Roboto',
          },
          color: 'darkolivegreen',
        },
        ticks: {
          callback: (value: any) => `$${formatNumber(value, 2)}`,
          color: 'darkslategray',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        suggestedMax: Math.max(
          ...years.map(year => Math.max(
            financialData[year]?.share_price_at_report_date || 0,
            financialData[year]?.earnings_per_share || 0
          ))
        ) * 1.1, // Add 10% padding
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        beginAtZero: true,
        title: {
          display: true,
          text: 'Revenue & Earnings ($)',
          font: {
            size: 14,
            weight: 'normal' as const,
            family: 'Roboto',
          },
          color: 'dodgerblue',
        },
        ticks: {
          callback: (value: any) => `$${formatShortNumber(value, 0)}`,
          color: 'darkslategray',
        },
        grid: {
          drawOnChartArea: false,
          color: 'rgba(0, 0, 0, 0.1)',
        },
        suggestedMax: Math.max(
          ...years.map(year => Math.max(
            financialData[year]?.revenue || 0,
            financialData[year]?.profit_after_tax_for_shareholders || 0
          ))
        ) * 1.1, // Add 10% padding
      },
    },
  };

  return (
    <div className="container">

      {/* Stock Selection */}
      <div className="section-container">
        <div className="financial-stock-selector">
          <h3>Financial Data for: </h3>

          {loading ? (
            <div style={{ margin: '2rem 1rem 3rem 1rem', textAlign: 'center' }}>
              <h5>Loading stocks...</h5>
            </div>
          ) : (
            <div>
              <select
                value={selectedStockId || ''}
                onChange={(e) => handleStockChange(Number(e.target.value))}
                className="stock-select"
              >
                <option value="">Select a stock...</option>
                {stocks.map(stock => (
                  <option key={stock.id} value={stock.id}>
                    {stock.ticker} - {stock.company_name} | {stock.sector} | {stock.country}
                  </option>
                ))}
              </select>
              {/* {selectedStock && (
                <div className="selected-stock-info">
                  <strong>{selectedStock.ticker}</strong> | {selectedStock.company_name}
                  <br />
                  <small>{selectedStock.sector} • {selectedStock.country}</small>
                </div>
              )} */}
            </div>
          )}
        </div>
      </div>

      {selectedStock && (
        <div className="section-separator">
          <hr />
        </div>
      )}


      {/* No stock selected */}
      {!selectedStock && (
        <div style={{ margin: '0 1rem 3rem 1rem', textAlign: 'center' }}>
          <h5>Please select a stock to view financial data.</h5>
        </div>
      )}


      {/* Charts Section */}
      {selectedStock && (
        <div className="section-container">
          <div className="financial-chart-container stocks-list-container">
            <div className="financial-heading-container financial-heading-container-single">
              <h4 
                onClick={() => setShowCharts(!showCharts)}
                className="financial-heading"
              >
                <span>{showCharts ? '▼' : '▶'}</span>
                Financial Data Chart
              </h4>
            </div>

            {showCharts && (
              <div className="financial-chart">
                <Line data={combinedChartData} options={chartOptions} />
              </div>
            )}
          </div>
        </div>
      )}


      {selectedStock && (
        <div className="section-separator">
          <hr />
        </div>
      )}



      {/* Investment Summary Section */}
      {selectedStock && (
        <div className="section-container">
          <div className="financial-investment-container stocks-list-container">
            <div className="financial-heading-container">
              <h4 
                onClick={() => setShowInvestmentSummary(!showInvestmentSummary)}
                className="financial-heading"
              >
                <span>{showInvestmentSummary ? '▼' : '▶'}</span>
                Investment Summary
              </h4>

              {showInvestmentSummary && (
                  <button 
                    onClick={handleSaveInvestmentSummary}
                    className="link-btn link-btn-financial"
                    disabled={!hasUnsavedSummaryChanges}
                    title={hasUnsavedSummaryChanges ? "Save investment summary to database" : "No changes to save"}
                  >
                    {hasUnsavedSummaryChanges 
                      ? <><span>💾</span>Save Summary</> 
                      : <><span>✅</span>Summary Saved</>
                      }
                  </button>
              )}
            </div>

            {showInvestmentSummary && (
              <div className="financial-investment-items">
              {investmentSummaryFields.map((field, index) => {

                if (field.type === 'calculated') {
                  const calculatedValues = investmentSummaryCalculated[field.key as keyof InvestmentSummaryCalculated];

                  const nDisplayValues = calculatedValues?.length;
                  if ((nDisplayValues ?? 0) > 2) {
                    console.error('Calculated field returns more than 2 values, which is not supported:', field);
                  }

                  const displayValues = [];

                  if (calculatedValues?.[0] && field.format_primary) {
                    displayValues[0] = field.format_primary(calculatedValues[0]);
                  } else {
                    displayValues[0] = calculatedValues?.[0] || '-';
                  }

                  if (calculatedValues?.[1] && field.format_secondary) {
                    displayValues[1] = field.format_secondary(calculatedValues[1]);
                  } else {
                    displayValues[1] = calculatedValues?.[1] || '-';
                  }

                  const columnCount = (nDisplayValues ?? 1) + 1;
                  const gridTemplate = columnCount === 2 
                    ? '3fr 3fr'
                    : '4fr 2fr 2fr'

                  const secondaryLabel = displayValues?.[1] !== '-' 
                    ? field?.secondary_label || ''
                    : '';

                  return (
                    <div key={`${field.key}-${index}`} 
                      className="financial-investment-item" 
                      style={{ gridTemplateColumns: gridTemplate }}
                    >
                      <label 
                        title={field.title}>{field.label}
                      </label>
                      <div 
                        key={`${field.key}-${index}-1`} 
                        className="financial-investment-item-value financial-investment-item-calcValue"
                      >
                        {displayValues[0]}
                      </div>

                      { (nDisplayValues ?? 0) > 1 && (
                        <div key={`${field.key}-${index}-2`} className="financial-investment-item-value financial-investment-item-calcValue">{displayValues[1]}</div>
                      )}

                    </div>
                  );

                } else if (field.type === 'input') {
                  return (
                    <div key={field.key} className="financial-investment-item">
                      <label 
                        title={field.title}
                      >
                        {field.label}
                      </label>
                      <input
                        type={field.inputType}
                        step={field.step}
                        value={(() => {
                          if (investInputValues[field.key] !== undefined) {
                            return investInputValues[field.key];
                          }
                          const fieldKey = field.key as keyof InvestmentSummary;
                          return investmentSummary?.[fieldKey]
                            ? formatNumber(investmentSummary[fieldKey] as number, field.decimals || 0)
                            : '';
                          }
                        )()}
                        onChange={(e) => {
                          console.log('Investmentsummary: ', investmentSummary);
                          setInvestInputValues(prev => ({
                            ...prev,
                            [field.key]: e.target.value
                          }));
                        }}
                        onBlur={(e) => {
                          const rawValue = investInputValues[field.key];
                          if (rawValue !== undefined) {
                            const numericValue = parseFormattedNumber(rawValue);
                            updateInvestmentSummary(field.key as keyof InvestmentSummary, numericValue);

                            setInvestInputValues(prev => {
                              const updated = { ...prev };
                              delete updated[field.key];
                              return updated;
                            });
                          }
                        }}
                        onPaste={(e) =>
                          handlePasteInvestmentSummary(e, field.key as keyof InvestmentSummary)}
                        className="financial-investment-item-input"
                        placeholder={field.placeholder}
                      />
                    </div>
                  );

                } else if (field.type === 'date') {
                  return (
                      <div key={field.key} className="financial-investment-item">
                      <label 
                        title={field.title}
                      >
                        {field.label}
                      </label>
                      <input
                        type={field.inputType}
                        value={(() => {
                        const inputValue = investmentSummary[field.key as keyof InvestmentSummary] as string;
                        return inputValue
                          ? inputValue
                          : '';
                        })()}
                        onChange={(e) => {
                          const value = e.target.value;
                          updateInvestmentSummary(field.key as keyof InvestmentSummary, value);
                        }}
                        className="financial-investment-item-input"
                        placeholder={new Date().toISOString().split('T')[0]}
                      />
                      </div>
                  );

                } else if (field.type === 'select' && field.options) {
                  return (
                    <div key={field.key} className="financial-investment-item">
                      <label 
                        title={field.title}
                      >
                        {field.label}
                      </label>
                      <select
                        value={investmentSummary[field.key as keyof InvestmentSummary] || ''}
                        id={`select-${field.key}`}
                        onChange={(e) => {
                          updateSelectStyle(field.key as keyof InvestmentSummary, index, `select-${field.key}`);
                          updateInvestmentSummary(field.key as keyof InvestmentSummary, e.target.value);
                        }}
                        onFocus={(e) => {updateSelectStyle(field.key as keyof InvestmentSummary, index, `select-${field.key}`, true)}}
                        onBlur={(e) => {updateSelectStyle(field.key as keyof InvestmentSummary, index, `select-${field.key}`)}}
                        className="financial-investment-item-input"
                      >
                        {field.options.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  );

                } else if (field.type === 'textarea') {
                  return (
                    <div key={field.key} className="financial-investment-item">
                      <label 
                        title={field.title}
                      >
                        {field.label}
                      </label>
                      <textarea
                        value={investmentSummary[field.key as keyof InvestmentSummary] || ''}
                        onChange={(e) => 
                          updateInvestmentSummary(field.key as keyof InvestmentSummary, e.target.value)}
                        className="financial-investment-item-input"
                        placeholder={field.placeholder}
                        rows={field.rows}
                      />
                    </div>
                  );
                }
                
                return null;
              })}
            </div>
            )}
          </div>
        </div>
      )}


      {selectedStock && (
        <div className="section-separator">
          <hr />
        </div>
      )}


      {/* Financial Data Input Section */}
      {selectedStock && (
        <div className="section-container">
          <div className="financial-data-container stocks-list-container">
            <div className="financial-heading-container">
              <h4 
                onClick={() => setShowFinancialData(!showFinancialData)}
                className="financial-heading"
              >
                <span>{showFinancialData ? '▼' : '▶'}</span>
                Financial Data Input
              </h4>
            </div>

              {showFinancialData && (
                <div className="financial-data-controls">
                  {errorForm && (
                    <div className="financial-data-err-msg">{errorForm}</div>
                  )}
                  <div className="financial-data-add-year">
                    <input
                      type="date"
                      value={newYear}
                      onChange={(e) => setNewYear(e.target.value)}
                      className="financial-data-add-year-form"
                      title="Select financial year end date"
                    />
                    <button onClick={addYear} className="link-btn link-btn-financial">
                      <><span>➕</span>Add Column</>
                    </button>
                  </div>
                  <button 
                    onClick={handleSave}
                    className="link-btn link-btn-financial"
                    disabled={!hasUnsavedChanges}
                    title={hasUnsavedChanges ? "Save financial data to database" : "No changes to save"}
                  >
                    {hasUnsavedChanges 
                      ? <><span>💾</span>Save Data</> 
                      : <><span>✅</span>Data Saved</>
                    }
                  </button>
                </div>
              )}
            
            {showFinancialData && (
              <div className="financial-data-instruction">
                <div 
                  className="financial-data-instruction-header" 
                  onClick={() => setShowPasteInstructions(!showPasteInstructions)}
                >
                  <h5>💡 Paste Instructions</h5>
                  <span className="collapse-icon">
                    {showPasteInstructions ? '▼' : '▶'}
                  </span>
                </div>
                {showPasteInstructions && (
                  <ul 
                    className="financial-data-instruction-content"
                  >
                    <li><strong>Single Value:</strong> Click on any cell and paste (Ctrl+V)</li>
                    <li><strong>Row Data:</strong> Click on metric label (e.g. Share Price) and paste (Ctrl+V) values for multiple years</li>
                    <li><strong>Column Data:</strong> Click on any cell and paste (Ctrl+V)</li>
                  </ul>
                )}
              </div>
            )}

            {showFinancialData && (
              <div className="financial-data-table">
                <table className="financial-data-table-input-table">
                  <thead>
                    <tr>
                      <th>Financial Metric</th>
                      {years.map(year => (
                        <th 
                          key={year} 
                          className="financial-data-table-header"
                          title={`Column data for ${year}`}
                        >
                          <div className="financial-data-table-header-year">
                            {editingYear === year ? (
                              <input
                                type="text"
                                value={tempYearValue}
                                onChange={(e) => setTempYearValue(e.target.value)}
                                onBlur={saveYearEdit}
                                onKeyDown={handleYearKeyPress}
                                autoFocus
                                title="Press Enter to save, Escape to cancel"
                              />
                            ) : (
                              <span 
                                onClick={() => startEditingYear(year)}
                                title="Click to edit year"
                              >
                                {year}
                              </span>
                            )}
                            <button
                              onClick={() => removeYear(year)}
                              className="financial-data-delete-btn"
                              title={`Remove ${year}`}
                            >
                              ✖
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orderedKeysWithSeparators.map(key => {
                      // Handle separatator rows
                      if (key.toLowerCase().includes('separator')) {
                        return (
                          <tr 
                            key={key} 
                            className="financial-data-table-separator-row"
                          >
                            <td 
                              colSpan={years.length + 1} 
                              className="financial-data-table-separator-row"
                            >
                              <div>
                                {key.replace('separator-', '').replace(/_/g, ' ')}
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      // Find the metric config
                      const metric = metrics.find(m => m.key === key);
                      if (!metric) return null;

                      // Check if this is a calculated field (read-only)
                      const isCalculated = years.length > 0 && financialDataCalculated[years[0]] && key in financialDataCalculated[years[0]];
                      // console.log('this is in financialDataCalculated[years[0]]', financialDataCalculated[years[0]]);

                      return (
                        <tr 
                          key={metric.key} 
                          className={'financial-data-table-data-row' + (isCalculated ? ' financial-data-table-calculated-row' : ' financial-data-table-input-row')}
                        >
                          <td 
                            className={'financial-data-table-metric-label'}
                              onPaste={(e) => {
                                const metricKey = metric.key as keyof YearlyFinancials;
                                handleRowPaste(e, metricKey)}}
                              title={metric.hoverText 
                                ? metric.hoverText 
                                : isCalculated 
                                ? ''
                                : `Click here and paste row data for ${metric.label}`}>
                            {metric.label} {metric.unit === '' ? '' : `(${metric.unit})`}
                          </td>
                          {years.map(year => (
                            // Read-only calculated value
                            isCalculated ? (
                              <td 
                                key={`${year}-${metric.key}`} 
                                className="financial-data-table-cell"
                              >
                                <div className="financial-data-table-calculated-value">
                                  {financialDataAll[year]?.[metric.key] 
                                    ? formatNumber(financialDataAll[year]![metric.key]!, metric.decimals || 0)
                                    : '-'
                                  }
                                </div>
                              </td>
                              ) : (
                                // Editable input
                              <td 
                                key={`${year}-${metric.key}`}
                                className="financial-data-table-cell"
                              >
                                <input
                                  type="text"
                                  id={`input-${year}-${metric.key}`}
                                  value={(() => {
                                    const inputKey = `${year}-${metric.key}`;
                                    // Show raw value during editing, formatted value otherwise
                                    if (inputValues[inputKey] !== undefined) {
                                      return inputValues[inputKey];
                                    }
                                    const metricKey = metric.key as keyof YearlyFinancials;
                                    return financialData[year]?.[metricKey] 
                                      ? formatNumber(financialData[year]![metricKey]!, metric.decimals || 0)
                                      : '';
                                  })()}
                                  onChange={(e) => {
                                    const metricKey = metric.key as keyof YearlyFinancials;
                                    handleInputChange(year, metricKey, e.target.value)}}
                                  onKeyDown={(e) => {
                                    const metricKey = metric.key as keyof YearlyFinancials;
                                    handleKeyDown(e, year, metricKey)}}
                                  onFocus={() => {
                                    const metricKey = metric.key as keyof YearlyFinancials;
                                    handleInputFocus(year, metricKey)}}
                                  onBlur={() => {
                                    const metricKey = metric.key as keyof YearlyFinancials;
                                    handleInputBlur(year, metricKey)}}
                                  onPaste={(e) => {
                                    const metricKey = metric.key as keyof YearlyFinancials;
                                    handlePaste(e, year, metricKey)}}
                                  className="financial-data-table-input-cell"
                                  placeholder={metric.decimals === 2 ? "0.00" : "0"}
                                  title={`Paste ${metric.label} data for ${year}`}
                                />
                              </td>
                            )
                          ))}
                        </tr>
                      )
                    })}

                    {fieldsForIncreasesCalc.map(fieldKey => {
                      const metric = metrics.find(m => m.key === fieldKey);
                      if (!metric) return null;

                      return (
                        <tr 
                          key={`row-${fieldKey}`} 
                          className="financial-data-table-data-row financial-data-table-calculated-row"
                        >
                          <td 
                            className="financial-data-table-metric-label"
                            title={`CAGR and YOY Increases in ${metric.label}`}
                          >
                            {metric.label}
                          </td>
                          {years.map(year => {
                            const increases = financialService.calculatePercentageIncrease(year, years, fieldKey, financialDataAll);
                            // const increases = calculatePercentageIncrease(year, fieldKey);
                            let isNegative = false;
                            let displayValue = '';

                            if (increases == null) {
                              displayValue = '-';
                            } else if (typeof increases === 'string' && increases.includes('-')) {
                              displayValue = increases;
                              isNegative = true;
                            } else if (typeof increases === 'string' && !increases.includes('-')) {
                              displayValue = increases;
                              isNegative = false;
                            } else if (typeof increases === 'number' && increases < 0) {
                              isNegative = true;
                              displayValue = `${increases.toFixed(1)}%`;
                            } else if (typeof increases === 'number' && increases > 0) {
                              displayValue = `${increases.toFixed(1)}%`;
                            }

                            return (
                              <td 
                                key={`${year}-${fieldKey}-increase`} 
                                className="financial-data-table-cell"
                              >
                                <div 
                                  className={`financial-data-table-calculated-value ${isNegative ? 'negative-value' : 'positive-value'}`}
                                >
                                  {displayValue}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}


      {selectedStock && (
        <div className="section-separator">
          <hr />
        </div>
      )}


      {/* AI Queries Section */}
      {selectedStock && (
        <div className="section-container">
          <div className="financial-ai-container stocks-list-container">
            <div className="financial-heading-container">
              <h4 
                onClick={() => setShowAiQueries(!showAiQueries)}
                className="financial-heading"
              >
                <span>{showAiQueries ? '▼' : '▶'}</span>
                AI Queries
              </h4>

              {showAiQueries && !loadingPrompts && Object.keys(aiPrompts).length > 0 && (
                <button
                  className="link-btn link-btn-financial"
                  onClick={handleGenerateAllResponses}
                  disabled={generatingResponse !== null}
                >
                  {generatingResponse !== null 
                    ? <><span>⏳</span>Generating All...</> 
                    : <><span>🤖</span> Generate All Responses</>
                  }
                </button>
              )}
            </div>
            
            {showAiQueries && (
              <div className="financial-ai-queries financial-ai-table-container">
                {loadingPrompts ? (
                  <div className="financial-ai-loading-msg">
                    Loading AI prompts...
                  </div>
                ) : Object.keys(aiPrompts).length === 0 ? (
                  <div className="financial-ai-empty-msg">
                    No AI prompts available for this stock.
                  </div>
                ) : (
                  <table className="financial-ai-table">
                    <thead>
                      <tr>
                        <th>Prompts</th>
                        <th>AI Response</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(aiPrompts).map(([Qid, prompt]) => 
                        <tr 
                          key={Qid}
                          className="financial-ai-table-row"
                        >
                          <td className="financial-ai-prompt-cell">
                            <div>
                              {Qid} - {prompt}
                            </div>
                          </td>
                          <td>
                            <div className="financial-ai-response">

                              <div className="financial-ai-response-button">
                                <button
                                  className="link-btn link-btn-financial-ai"
                                  onClick={() => handleGenerateAIResponse(Qid)}
                                  disabled={generatingResponse !== null}
                                >
                                  {generatingResponse === Qid 
                                    ? <><span>⏳</span>Generating...</> 
                                    : aiResponses[Qid] 
                                      ? <><span>🔄</span>Re-Generate AI Response</>
                                      : <><span>🤖</span>Generate AI Response</>
                                  }
                                </button>
                              </div>

                                {aiResponses[Qid] && (
                                  <div className="financial-ai-response-text">{aiResponses[Qid]}</div>
                                )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialPage;
