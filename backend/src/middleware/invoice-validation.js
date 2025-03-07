/**
 * Invoice validation middleware
 * Validates the JSON input for invoice generation
 */

const validateInvoiceInput = (req, res, next) => {
    try {
        // TODO:
        // 1. Check if all required fields exist
        // 2. Check if all fields are of the correct type
        // 3. Check if all fields are valid

        const data = req.body;

        // Check if all required fields exist
        const requiredFields = ['invoiceId', 'total', 'buyer', 'supplier', 'issueDate', 'dueDate', 'currency', 'buyerAddress', 'buyerPhone', 'items'];
        const missingFields = requiredFields.filter(field => !(field in data));
        
        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        // Check if all fields are of the correct type
        const typeChecks = {
            invoiceId: 'string',
            total: 'number',
            buyer: 'string',
            supplier: 'string',
            issueDate: 'string',
            dueDate: 'string',
            currency: 'string',
            buyerPhone: 'string'
        };

        Object.entries(typeChecks).forEach(([field, expectedType]) => {
            if (typeof data[field] !== expectedType) {
            throw new Error(`${field} must be a ${expectedType}`);
            }
        });

        // Check address fields
        if (!data.buyerAddress.street || !data.buyerAddress.country) {
            throw new Error('Buyer address must include street and country');
        }

        // Check items array
        if (!Array.isArray(data.items) || data.items.length === 0) {
            throw new Error('Items must be a non-empty array');
        }

        // Check each item has required fields
        data.items.forEach((item, index) => {
            const requiredItemFields = ['name', 'count', 'cost'];
            const missingItemFields = requiredItemFields.filter(field => !(field in item));
            if (missingItemFields.length > 0) {
            throw new Error(`Item ${index} missing fields: ${missingItemFields.join(', ')}`);
            }
        });

        // Check all fileds are valid

        // Check if issue date and due date are in proper date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(data.issueDate)) {
            throw new Error('Issue date must be in YYYY-MM-DD format');
        }
        if (!dateRegex.test(data.dueDate)) {
            throw new Error('Due date must be in YYYY-MM-DD format');
        }

        // Check if issue date is a valid date
        const issueDate = new Date(data.issueDate);
        if (isNaN(issueDate.getTime())) {
            throw new Error('Issue date is not a valid date');
        }

        // Check if due date is a valid date
        const dueDate = new Date(data.dueDate);
        if (isNaN(dueDate.getTime())) {
            throw new Error('Due date is not a valid date');
        }

        // Check if issue date is before due date
        if (issueDate >= dueDate) {
            throw new Error('Issue date must be before due date');
        }

        // Check item count and cost
        let sum = 0;
        for (const item of data.items) {
            if (item.count <= 0) {
                throw new Error('Item count must be greater than 0');
            }
            if (item.cost <= 0) {
                throw new Error('Item cost must be greater than 0');
            }
            sum += item.cost;
        }

        // Check invoice total against item costs
        if (data.total !== sum) {
            throw new Error('Invoice total does not match item costs');
        }

        // check valid currency code
        if (!checkCurrencyCode(data.currency)) {
            throw new Error('Invalid currency code');
        }

        if (!checkCountryCode(data.buyerAddress.country)) {
            throw new Error('Invalid country code');
        }

        next();
    } catch (error) {
        return res.status(400).json({
            status: 'error',
            message: error.message,
            error: error.message
        });
    }
};

const checkCurrencyCode = (currencyCode) => {
    // List of valid currency codes
    const validCodes = ["ZMW", "ZWG", "ZAR", "YER", "XXX", "XUA", "XTS", "XSU", "XPT", "XPF", "XPD", "XOF", "XDR", "XCD", "XBD", "XBC", "XBB", "XBA", "XAU", "XAG", "XAF", "WST", "VUV", "VND", "VES", "VED", "UZS", "UYW", "UYU", "UYI", "USN", "USD", "UGX", "UAH", "TZS", "TWD", "TTD", "TRY", "TOP", "TND", "TMT", "TJS", "THB", "SZL", "SYP", "SVC", "STN", "SSP", "SRD", "SOS", "SLE", "SHP", "SGD", "SEK", "SDG", "SCR", "SBD", "SAR", "RWF", "RUB", "RSD", "RON", "QAR", "PYG", "PLN", "PKR", "PHP", "PGK", "PEN", "PAB", "OMR", "NZD", "NPR", "NOK", "NIO", "NGN", "NAD", "MZN", "MYR", "MXV", "MXN", "MWK", "MVR", "MUR", "MRU", "MOP", "MNT", "MMK", "MKD", "MGA", "MDL", "MAD", "LYD", "LSL", "LRD", "LKR", "LBP", "LAK", "KZT", "KYD", "KWD", "KRW", "KPW", "KMF", "KHR", "KGS", "KES", "JPY", "JOD", "JMD", "ISK", "IRR", "IQD", "INR", "ILS", "IDR", "HUF", "HTG", "HNL", "HKD", "GYD", "GTQ", "GNF", "GMD", "GIP", "GHS", "GEL", "GBP", "FKP", "FJD", "EUR", "ETB", "ERN", "EGP", "DZD", "DOP", "DKK", "DJF", "CZK", "CVE", "CUP", "CRC", "COU", "COP", "CNY", "CLP", "CLF", "CHW", "CHF", "CHE", "CDF", "CAD", "BZD", "BYN", "BWP", "BTN", "BSD", "BRL", "BOV", "BOB", "BND", "BMD", "BIF", "BHD", "BGN", "BDT", "BBD", "BAM", "AZN", "AWG", "AUD", "ARS", "AOA", "ANG", "AMD", "ALL", "AFN", "AED"];
    return validCodes.includes(currencyCode.toUpperCase());
}

const checkCountryCode = (countryCode) => { 
    const validCodes = ["AF", "AX", "AL", "DZ", "AS", "AD", "AO", "AI", "AQ", "AG", "AR", "AM", "AW", "AU", "AT", "AZ", "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ", "BM", "BT", "BO", "BQ", "BA", "BW", "BV", "BR", "IO", "BN", "BG", "BF", "BI", "CV", "KH", "CM", "CA", "KY", "CF", "TD", "CL", "CN", "CX", "CC", "CO", "KM", "CD", "CG", "CK", "CR", "CI", "HR", "CU", "CW", "CY", "CZ", "DK", "DJ", "DM", "DO", "EC", "EG", "SV", "GQ", "ER", "EE", "SZ", "ET", "FK", "FO", "FJ", "FI", "FR", "GF", "PF", "TF", "GA", "GM", "GE", "DE", "GH", "GI", "GR", "GL", "GD", "GP", "GU", "GT", "GG", "GN", "GW", "GY", "HT", "HM", "VA", "HN", "HK", "HU", "IS", "IN", "ID", "IR", "IQ", "IE", "IM", "IL", "IT", "JM", "JP", "JE", "JO", "KZ", "KE", "KI", "KP", "KR", "KW", "KG", "LA", "LV", "LB", "LS", "LR", "LY", "LI", "LT", "LU", "MO", "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MQ", "MR", "MU", "YT", "MX", "FM", "MD", "MC", "MN", "ME", "MS", "MA", "MZ", "MM", "NA", "NR", "NP", "NL", "NC", "NZ", "NI", "NE", "NG", "NU", "NF", "MK", "MP", "NO", "OM", "PK", "PW", "PS", "PA", "PG", "PY", "PE", "PH", "PN", "PL", "PT", "PR", "QA", "RE", "RO", "RU", "RW", "BL", "SH", "KN", "LC", "MF", "PM", "VC", "WS", "SM", "ST", "SA", "SN", "RS", "SC", "SL", "SG", "SX", "SK", "SI", "SB", "SO", "ZA", "GS", "SS", "ES", "LK", "SD", "SR", "SJ", "SE", "CH", "SY", "TW", "TJ", "TZ", "TH", "TL", "TG", "TK", "TO", "TT", "TN", "TR", "TM", "TC", "TV", "UG", "UA", "AE", "GB", "UM", "US", "UY", "UZ", "VU", "VE", "VN", "VG", "VI", "WF", "EH", "YE", "ZM", "ZW"];
    return validCodes.includes(countryCode.toUpperCase());
}

/**
 * Validate invoice standard
 * Validates the invoice standard against UBL 2.4, peppol, etc.
 */
const validateInvoiceStandard = (req, res, next) => {
    try {
        // TODO:
        // 1. Validate invoice standard against UBL 2.4, peppol, etc.
    } catch (error) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid invoice data',
            errors: error.details
        });
    }
};

module.exports = {
    validateInvoiceInput,
    validateInvoiceStandard
}; 