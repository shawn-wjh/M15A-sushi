const currencyService = require('../externalAPI/currencyService/currencyService');

/**
 * Controller for currency-related operations
 */
const currencyController = {
  /**
   * Get all available exchange rates
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  getExchangeRates: async (req, res) => {
    try {
      // Get exchange rates from currency service
      const exchangeRates = await currencyService.getExchangeRates();
      
      return res.status(200).json({
        status: 'success',
        data: exchangeRates
      });
    } catch (error) {
      console.error('Currency controller error:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  },
  
  /**
   * Convert invoice amounts to a different currency
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  convertInvoiceCurrency: async (req, res) => {
    try {
      const { invoice, targetCurrency } = req.body;
      
      if (!invoice) {
        return res.status(400).json({
          status: 'error',
          error: 'Invoice data is required'
        });
      }
      
      if (!targetCurrency) {
        return res.status(400).json({
          status: 'error',
          error: 'Target currency is required'
        });
      }
      
      // Get source currency from invoice, default to AUD
      const sourceCurrency = invoice.currency || 'AUD';
      
      // If source and target currencies are the same, no need to convert
      if (sourceCurrency === targetCurrency) {
        return res.status(200).json({
          status: 'success',
          data: invoice,
          message: 'No conversion needed, currencies are the same'
        });
      }
      
      // Get latest exchange rates
      const exchangeRates = await currencyService.getExchangeRates();
      
      // Verify target currency is supported
      if (!exchangeRates[targetCurrency]) {
        return res.status(400).json({
          status: 'error',
          error: `Unsupported target currency: ${targetCurrency}`
        });
      }
      
      // Convert total amount
      const totalResult = await currencyService.convertCurrency(
        parseFloat(invoice.total) || 0,
        sourceCurrency,
        targetCurrency
      );
      
      // Convert tax total amount
      const taxTotalResult = await currencyService.convertCurrency(
        parseFloat(invoice.taxTotal) || 0,
        sourceCurrency,
        targetCurrency
      );
      
      // Create a copy of the invoice with converted values
      const convertedInvoice = {
        ...invoice,
        currency: targetCurrency,
        total: totalResult.convertedAmount,
        taxTotal: taxTotalResult.convertedAmount,
        // Convert individual item costs
        items: invoice.items ? invoice.items.map(item => {
          return {
            ...item,
            currency: targetCurrency,
            cost: item.cost * totalResult.exchangeRate // Apply same exchange rate for consistency
          };
        }) : []
      };
      
      return res.status(200).json({
        status: 'success',
        data: {
          invoice: convertedInvoice,
          conversionInfo: {
            sourceCurrency,
            targetCurrency,
            exchangeRate: totalResult.exchangeRate,
            originalTotal: totalResult.originalAmount,
            convertedTotal: totalResult.convertedAmount
          }
        }
      });
    } catch (error) {
      console.error('Currency conversion error:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }
};

module.exports = currencyController; 