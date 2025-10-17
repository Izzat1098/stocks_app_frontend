import React, { useState, useEffect } from 'react';
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
import financialService, { FinancialData, FinancialDataWithMeta, FinancialMetric, YearlyFinancials } from '../services/financialService';
import promptService, { PromptResponse } from '../services/promptService';
import './FinancialPage.css';

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
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [selectedStockId, setSelectedStockId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [years, setYears] = useState<string[]>([]);
  const [newYear, setNewYear] = useState<string>('');
  const [financialData, setFinancialData] = useState<FinancialData>({});
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

  const DEFAULT_UNIT = '$';
  const DEFAULT_DECIMALS = 0;

  const metrics: FinancialMetric[] = [
    { key: 'sharePrice', label: 'Share Price', unit: '$', decimals: 2 },
    { key: 'revenue', label: 'Revenue', unit: '$', decimals: 0 },
    { key: 'earnings', label: 'Earnings', unit: '$', decimals: 0 },
    { key: 'earningsPerShare', label: 'Earnings Per Share', unit: '$', decimals: 2 },
  ];

  // Format number with commas and decimals
  const formatNumber = (value: number, decimals: number = 0): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  // Parse formatted number back to number
  const parseFormattedNumber = (value: string): number => {
    // Remove currency codes, symbols, and unwanted characters
    let cleaned = value
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

        if (stocksData.length > 0) {
          setSelectedStockId(stocksData[0].id || null);
        }

      } catch (error) {
        console.error('Failed to fetch stocks:', error);

      } finally {
        setLoading(false);
      }
    };
    fetchStocks();
  }, []);


  useEffect(() => {
    const fetchFinancialData = async () => {
      if (!selectedStockId) return;

      try {
        const data = await financialService.getFinancialData(selectedStockId);
        if (data) {
          setFinancialData(data.data);
          setOriginalFinancialData(JSON.parse(JSON.stringify(data.data))); // Deep copy
          const fetchedYears = Object.keys(data.data).sort();
          setYears(fetchedYears);
          setHasUnsavedChanges(false);
        } else {
          initStartingData();
        }
        setErrorForm('');

      } catch (error: any) {
        if (error.response?.status === 404) {
          console.log('No financial data found for this stock, starting fresh');
          setErrorForm('No financial data found for this stock. You can start entering data.');
        } else {
          console.error('Error fetching financial data:', error);
          setErrorForm('Error fetching financial data. Please try again.');
        }
        initStartingData();
      }
    };

    const fetchAiPrompts = async () => {
      setLoadingPrompts(true);
      try {
        const prompts = await promptService.getAllPrompts( );
        console.log('Fetched AI prompts for stock:', prompts);
        if (prompts) {
          setAiPrompts(prompts);
        }

        if (selectedStockId) {
          const responses = await promptService.getAllResponses(selectedStockId);
          if (responses) {
            console.log('Fetched AI responses for stock:', responses);
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

    fetchFinancialData();
    fetchAiPrompts();
  }, [selectedStockId]);

  // Detect changes in financial data
  useEffect(() => {
    const hasChanges = JSON.stringify(financialData) !== JSON.stringify(originalFinancialData);
    setHasUnsavedChanges(hasChanges);
  }, [financialData, originalFinancialData]);


  const selectedStock = stocks.find(stock => stock.id === selectedStockId);
  
  // Handle stock selection change
  const handleStockChange = (stockId: number) => {
    // Clear previous data immediately
    setFinancialData({});
    setYears([]);
    setInputValues({});

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
    event.preventDefault();
    
    const pasteData = event.clipboardData.getData('text');
    const lines = pasteData.trim().split('\n');
    
    // If pasting multiple lines, try to map them to metrics
    if (lines.length > 1) {
      const updatedData = { ...financialData };
      
      lines.forEach((line, index) => {
        const value = parseFormattedNumber(line.trim());
        if (value && metrics[index]) {
          if (!updatedData[year]) {
            updatedData[year] = {};
          }
          updatedData[year][metrics[index].key] = value;
        }
      });
      
      setFinancialData(updatedData);
    } else {
      // Single value paste
      const value = parseFormattedNumber(pasteData);
      updateFinancialData(year, metricKey, value);
    }
  };

  // Handle paste for entire column (year)
  const handleColumnPaste = async (event: React.ClipboardEvent, year: string) => {
    event.preventDefault();
    
    const pasteData = event.clipboardData.getData('text');
    const lines = pasteData.trim().split('\n');
    
    const updatedData = { ...financialData };
    if (!updatedData[year]) {
      updatedData[year] = {};
    }
    
    // Map lines to metrics in order
    lines.forEach((line, index) => {
      const value = parseFormattedNumber(line.trim());
      if (value && metrics[index]) {
        updatedData[year][metrics[index].key] = value;
      }
    });
    
    setFinancialData(updatedData);
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

      await financialService.saveFinancialData(selectedStockId, financialDataToSave);
      
      // Update original data to reflect saved state
      setOriginalFinancialData(JSON.parse(JSON.stringify(financialData)));
      setHasUnsavedChanges(false);
      
    } catch (error) {
      console.error('Failed to save financial data:', error);
      alert('Failed to save financial data. Please try again.');
    }
  };

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
      alert('Failed to generate AI response. Please try again.');
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
    setFinancialData(prev => ({
      ...prev,
      [year]: {
        ...prev[year],
        [metric]: value
      }
    }));
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
    const rawValue = inputValues[inputKey];
    if (rawValue !== undefined) {
      const numericValue = parseFormattedNumber(rawValue);
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
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Find current metric index
      const currentMetricIndex = metrics.findIndex(m => m.key === metricKey);
    
      // Move to next row (next metric)
      if (currentMetricIndex < metrics.length - 1) {
        const nextMetric = metrics[currentMetricIndex + 1];
        const nextInputId = `input-${year}-${nextMetric.key}`;
        const nextInput = document.getElementById(nextInputId);
        if (nextInput) {
          nextInput?.focus();
        }
      }
    }
  };

  // Calculate price to earnings ratio
  const calculatePERatio = (currentYear: string): number | null => {
    const currentYearIndex = years.indexOf(currentYear);
    const currentSharePrice = financialData[currentYear]?.sharePrice;
    const currentEarningsPerShare = financialData[currentYear]?.earningsPerShare;
    
    if (!currentSharePrice || !currentEarningsPerShare || currentSharePrice === 0 || currentEarningsPerShare === 0) return null;
    
    return currentSharePrice / currentEarningsPerShare;
  };


  // Calculate percentage increase (with CAGR for first year)
  const calculatePercentageIncrease = (currentYear: string, metricKey: keyof YearlyFinancials): string => {
    const currentYearIndex = years.indexOf(currentYear);
    if (currentYearIndex < 0) return '-'; // No previous year to compare

    const currentValue = financialData[currentYear]?.[metricKey];

    if (currentYearIndex === 0) { // for CAGR calculation at the first year
      const nYears = years.length;
      const latestValue = financialData[years[nYears - 1]]?.[metricKey];
      if (latestValue && currentValue && latestValue > 0 && currentValue > 0 && nYears > 1) {
        const CAGR = (Math.pow((latestValue / currentValue), (1 / (nYears - 1))) - 1) * 100;
        if (CAGR > 0) {
          return `CAGR = +${CAGR.toFixed(1)}%`;
        } else {
          return `CAGR = ${CAGR.toFixed(1)}%`;
        }
      } else return '-';
    }
    
    const previousYear = years[currentYearIndex - 1];
    const previousValue = financialData[previousYear]?.[metricKey];
    if (!currentValue || !previousValue || previousValue === 0) return '-';

    const revenueIncrease = ((currentValue - previousValue) / previousValue) * 100;
    if (revenueIncrease > 0) {
      return `+${revenueIncrease.toFixed(1)}%`;
    } else {
      return `${revenueIncrease.toFixed(1)}%`;
    }
  };


  // Combined chart data with dual Y-axes
  const combinedChartData = {
    // labels: years.map(year => formatYearForDisplay(year)),
    labels: years,
    datasets: [
      {
        label: 'Share Price ($)',
        data: years.map(year => financialData[year]?.sharePrice || 0),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        yAxisID: 'y',
        borderWidth: 3,
        pointStyle: 'triangle',
        pointRadius: 6,
      },
      {
        label: 'Earnings Per Share ($)',
        data: years.map(year => financialData[year]?.earningsPerShare || 0),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        yAxisID: 'y',
        borderWidth: 3,
        pointStyle: 'triangle',
        pointRadius: 6,
      },
      {
        label: 'Revenue ($)',
        data: years.map(year => financialData[year]?.revenue || 0),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        yAxisID: 'y1',
        borderWidth: 3,
        pointStyle: 'rect',
        pointRadius: 6,
      },
      {
        label: 'Earnings ($)',
        data: years.map(year => financialData[year]?.earnings || 0),
        borderColor: 'rgb(255, 206, 86)',
        backgroundColor: 'rgba(255, 206, 86, 0.2)',
        yAxisID: 'y1',
        borderWidth: 3,
        pointStyle: 'rect',
        pointRadius: 6,
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
        text: 'Annual Financial Results',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
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
          font: {
            size: 14,
            weight: 'bold' as const,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
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
            weight: 'bold' as const,
          },
          color: 'rgb(75, 192, 192)',
        },
        ticks: {
          callback: (value: any) => `$${formatNumber(value, 2)}`,
        },
        grid: {
          color: 'rgba(75, 192, 192, 0.2)',
        },
        suggestedMax: Math.max(
          ...years.map(year => Math.max(
            financialData[year]?.sharePrice || 0,
            financialData[year]?.earningsPerShare || 0
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
            weight: 'bold' as const,
          },
          color: 'rgb(54, 162, 235)',
        },
        ticks: {
          callback: (value: any) => `$${formatNumber(value, 0)}`,
        },
        grid: {
          drawOnChartArea: false,
          color: 'rgba(54, 162, 235, 0.2)',
        },
        suggestedMax: Math.max(
          ...years.map(year => Math.max(
            financialData[year]?.revenue || 0,
            financialData[year]?.earnings || 0
          ))
        ) * 1.1, // Add 10% padding
      },
    },
  };

  return (
    <div className="container">
      <h1>Financial Data Management</h1>

      {/* Stock Selection */}
      <div className="card">
        <div className="stock-selector-section">
          <h2>Select Stock</h2>
          {loading ? (
            <div>Loading stocks...</div>
          ) : (
            <div className="stock-selector">
              <select
                value={selectedStockId || ''}
                onChange={(e) => handleStockChange(Number(e.target.value))}
                className="stock-select"
              >
                <option value="">Select a stock...</option>
                {stocks.map(stock => (
                  <option key={stock.id} value={stock.id}>
                    {stock.ticker} - {stock.company_name}
                  </option>
                ))}
              </select>
              {selectedStock && (
                <div className="selected-stock-info">
                  <strong>{selectedStock.ticker}</strong> | {selectedStock.company_name}
                  <br />
                  <small>{selectedStock.sector} • {selectedStock.country}</small>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Charts Section */}
      {selectedStock && (
        <div className="card">
          <h2>Financial Data Chart - {selectedStock.ticker} | {selectedStock.company_name}</h2>
          <div className="chart-container">
            <Line data={combinedChartData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* Financial Data Input Section */}
      {selectedStock && (
        <div className="card">
          <div className="card-header">
            <h2>Financial Data Input - {selectedStock.ticker} | {selectedStock.company_name}</h2>
            <div className="year-controls">
              {errorForm && (
                <div className="error-left">{errorForm}</div>
              )}
              <div className="add-year">
                <input
                  type="date"
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
                  className="form-input"
                  title="Select financial year end date"
                />
                <button onClick={addYear} className="btn btn-primary">
                  Add Column
                </button>
              </div>
              <button 
                onClick={handleSave}
                className="btn btn-save"
                disabled={!hasUnsavedChanges}
                title={hasUnsavedChanges ? "Save financial data to database" : "No changes to save"}
              >
                {hasUnsavedChanges ? '💾 Save Data' : '✓ Data Saved'}
              </button>
            </div>
          </div>

          <div className="paste-instructions">
            <div className="paste-instructions-header" onClick={() => setShowPasteInstructions(!showPasteInstructions)}>
              <h4>💡 Paste Instructions</h4>
              <span className="collapse-icon">
                {showPasteInstructions ? '▼' : '▶'}
              </span>
            </div>
            {showPasteInstructions && (
              <ul className="paste-instructions-content">
                <li><strong>Single Value:</strong> Click on any cell and paste (Ctrl+V)</li>
                <li><strong>Row Data:</strong> Click on metric label (e.g. Share Price) and paste values for all years</li>
                <li><strong>Column Data:</strong> Click on year header (e.g. 2020) and paste values for all metrics</li>
              </ul>
            )}

          </div>

        <div className="financial-table-container">
          <table className="financial-table">
            <thead>
              <tr>
                <th>Financial Metric</th>
                {years.map(year => (
                  <th key={year} className="year-header"
                      onPaste={(e) => handleColumnPaste(e, year)}
                      title={`Paste column data for ${year}`}>
                    <div className="year-header-content">
                      {editingYear === year ? (
                        <input
                          type="text"
                          value={tempYearValue}
                          onChange={(e) => setTempYearValue(e.target.value)}
                          onBlur={saveYearEdit}
                          onKeyDown={handleYearKeyPress}
                          className="year-edit-input"
                          autoFocus
                          title="Press Enter to save, Escape to cancel"
                        />
                      ) : (
                        <span 
                          onClick={() => startEditingYear(year)}
                          className="year-display"
                          title="Click to edit year"
                        >
                          {year}
                        </span>
                      )}
                      <button
                        onClick={() => removeYear(year)}
                        className="btn-icon btn-delete-small"
                        title={`Remove ${year}`}
                      >
                        ×
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map(metric => (
                <tr key={metric.key}>
                  <td className="metric-label"
                      onPaste={(e) => handleRowPaste(e, metric.key)}
                      title={`Paste row data for ${metric.label} (values for all years)`}>
                    {metric.label} ({metric.unit})
                  </td>
                  {years.map(year => (
                    <td key={`${year}-${metric.key}`}>
                      <input
                        type="text"
                        id={`input-${year}-${metric.key}`}
                        value={(() => {
                          const inputKey = `${year}-${metric.key}`;
                          // Show raw value during editing, formatted value otherwise
                          if (inputValues[inputKey] !== undefined) {
                            return inputValues[inputKey];
                          }
                          return financialData[year]?.[metric.key] 
                            ? formatNumber(financialData[year]![metric.key]!, metric.decimals || 0)
                            : '';
                        })()}
                        onChange={(e) => handleInputChange(year, metric.key, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, year, metric.key)}
                        onFocus={() => handleInputFocus(year, metric.key)}
                        onBlur={() => handleInputBlur(year, metric.key)}
                        onPaste={(e) => handlePaste(e, year, metric.key)}
                        className="financial-input"
                        placeholder={metric.decimals === 2 ? "0.00" : "0"}
                        title={`Paste ${metric.label} data for ${year}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}

              {/* P/E Row */}
              <tr className="calculated-row">
                <td className="metric-label calculated-label">
                  P/E Ratio
                </td>
                {years.map(year => {
                  const peRatio = calculatePERatio(year);
                  return (
                    <td key={`${year}-pe-ratio`} className="calculated-cell">
                      <div className="calculated-value">
                        {peRatio !== null 
                          ? `${peRatio.toFixed(1)}`
                          : '-'
                        }
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Revenue Increase % Row */}
              <tr className="calculated-row">
                <td className="metric-label calculated-label">
                  Revenue Increase (%)
                </td>
                {years.map(year => {
                  const revenueIncrease = calculatePercentageIncrease(year, 'revenue');
                  const isNegative = revenueIncrease.includes('-');
                  return (
                    <td key={`${year}-revenue-increase`} className="calculated-cell">
                      <div className={`calculated-value ${isNegative ? 'negative-value' : 'positive-value'}`}>
                        {revenueIncrease !== null 
                          ? `${revenueIncrease}`
                          : '-'
                        }
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Earnings Increase % Row */}
              <tr className="calculated-row">
                <td className="metric-label calculated-label">
                  Earnings Increase (%)
                </td>
                {years.map(year => {
                  const earningsIncrease = calculatePercentageIncrease(year, 'earnings');
                  const isNegative = earningsIncrease.includes('-');
                  return (
                    <td key={`${year}-earnings-increase`} className="calculated-cell">
                      <div className={`calculated-value ${isNegative ? 'negative-value' : 'positive-value'}`}>
                        {earningsIncrease !== null 
                          ? `${earningsIncrease}`
                          : '-'
                        }
                      </div>
                    </td>
                  );
                })}
              </tr>

            </tbody>
          </table>
        </div>
      </div>
      )}

        {/* AI Queries Section */}
      <div className="card">
        <div>
          <div className="ai-queries-header">
            <h3 className="ai-queries-title">
              AI Queries
            </h3>
            {!loadingPrompts && Object.keys(aiPrompts).length > 0 && (
              <button
                className="btn btn-primary btn-outline"
                onClick={handleGenerateAllResponses}
                disabled={generatingResponse !== null}
              >
                {generatingResponse !== null ? '⏳ Generating All...' : '🤖 Generate All Responses'}
              </button>
            )}
          </div>
          
          {loadingPrompts ? (
            <div className="ai-loading-message">
              Loading AI prompts...
            </div>
          ) : Object.keys(aiPrompts).length === 0 ? (
            <div className="ai-empty-message">
              No AI prompts available for this stock.
            </div>
          ) : (
            <table className="financial-table ai-prompts-table">
              <thead>
                <tr>
                  <th className="ai-prompts-table-header-prompt">Prompts</th>
                  <th className="ai-prompts-table-header-response">AI Response</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(aiPrompts).map(([Qid, prompt]) => 
                  <tr key={Qid}>
                    <td className="prompt-cell">
                      <div className="prompt-text">
                        {Qid} - {prompt}
                      </div>
                    </td>
                    <td className="response-cell">
                      <div className="response-container">
                            {aiResponses[Qid] && (
                            <div className="response-text">{aiResponses[Qid]}</div>
                            )}
                        <div className="response-button-container">
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => handleGenerateAIResponse(Qid)}
                            disabled={generatingResponse !== null}
                          >
                            {generatingResponse === Qid 
                              ? '⏳ Generating...' 
                              : aiResponses[Qid] 
                                ? '🔄 Re-Generate AI Response'
                                : '🤖 Generate AI Response'
                            }
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialPage;
