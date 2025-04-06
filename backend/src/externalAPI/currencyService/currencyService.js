const axios = require('axios');

/**
 * Service for interacting with the external Currency Exchange API
 */
const currencyService = {
  /**
   * Get latest exchange rates with AUD as base currency
   * @returns {Promise<Object>} Exchange rates data
   */
  getExchangeRates: async () => {
    // The API URL with API key
    const CURRENCY_API_URL = 'https://api.freecurrencyapi.com/v1/latest';
    const API_KEY = process.env.CURRENCY_API_KEY || 'fca_live_3nycuKvr5fPePE1xDoVjeNFlfHMayVzVqaxt8Rax';
    
    // Set AUD as the base currency
    const url = `${CURRENCY_API_URL}?apikey=${API_KEY}&base_currency=AUD`;
    
    console.log(`Making request to currency API: ${CURRENCY_API_URL}`);
    
    try {
      const response = await axios.get(url, {
        // Set a timeout to avoid hanging requests
        timeout: 10000
      });
      
      console.log('Currency API response status:', response.status);
      
      // Return the exchange rates data
      return response.data.data || {};
    } catch (error) {
      // Enhanced error handling
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      const statusCode = error.response?.status;
      
      console.error(`Error fetching exchange rates [${statusCode}]:`, errorMessage);
      
      if (error.response) {
        console.error('External API error response:', {
          status: error.response.status,
          data: error.response.data
        });
      } else if (error.request) {
        console.error('External API did not respond');
      }
      
      // Throw an error with useful details
      throw new Error(`Failed to fetch exchange rates: ${errorMessage}`);
    }
  },
  
  /**
   * Convert amount from source currency to target currency
   * @param {number} amount - The amount to convert
   * @param {string} sourceCurrency - Source currency code (e.g., 'AUD')
   * @param {string} targetCurrency - Target currency code (e.g., 'USD')
   * @returns {Promise<Object>} Converted amount and exchange rate
   */
  convertCurrency: async (amount, sourceCurrency, targetCurrency) => {
    // Get exchange rates with AUD as base
    const exchangeRates = await currencyService.getExchangeRates();
    
    // If source is already AUD, simple conversion
    if (sourceCurrency === 'AUD') {
      const rate = exchangeRates[targetCurrency];
      const convertedAmount = amount * rate;
      
      return {
        originalAmount: amount,
        originalCurrency: sourceCurrency,
        convertedAmount,
        convertedCurrency: targetCurrency,
        exchangeRate: rate
      };
    }
    
    // If source is not AUD, need to convert to AUD first, then to target
    const sourceToAUDRate = 1 / exchangeRates[sourceCurrency]; // Invert rate to get X to AUD
    const amountInAUD = amount * sourceToAUDRate;
    
    // If target is AUD, we're done
    if (targetCurrency === 'AUD') {
      return {
        originalAmount: amount,
        originalCurrency: sourceCurrency,
        convertedAmount: amountInAUD,
        convertedCurrency: targetCurrency,
        exchangeRate: sourceToAUDRate
      };
    }
    
    // Otherwise, convert from AUD to target
    const AUDToTargetRate = exchangeRates[targetCurrency];
    const convertedAmount = amountInAUD * AUDToTargetRate;
    
    return {
      originalAmount: amount,
      originalCurrency: sourceCurrency,
      convertedAmount,
      convertedCurrency: targetCurrency,
      // Calculate direct exchange rate between source and target
      exchangeRate: sourceToAUDRate * AUDToTargetRate
    };
  }
};

module.exports = currencyService; 