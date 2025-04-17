import React from 'react';
import { useHistory } from 'react-router-dom';
import './SearchList.css';

const SearchList = ({ searchResults }) => {
    const history = useHistory();
    console.log("searchResults", searchResults);

    const handleResultClick = (invoiceId) => {
        console.log("invoiceId", invoiceId);
        history.push(`/invoices/${invoiceId}`);
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="search-results-dropdown">
            {searchResults.map(result => (
                <div 
                    key={result.InvoiceID} 
                    className="search-result-item"
                    onClick={() => handleResultClick(result.InvoiceID)}
                >
                    <div className="result-icon">
                        <i className="fas fa-file-invoice"></i>
                    </div>
                    <div className="result-content">
                        <div className="result-subtitle">
                            {result.matchType === 'Customer' ? 'Customer' : 'Supplier'}: {result.matchType === 'Customer' ? result.invoiceJson.buyer : result.invoiceJson.supplier}
                        </div>
                        <div className="result-timestamp">
                            Last modified: {formatDate(result.timestamp)}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const getSearchList = ({ input, list }) => {
    const maxSearchResults = 10;

    if (!input || input.trim() === "") {
        return [];
    }

    const searchTerm = input.toLowerCase();
    let results = [];

    // Search in buyer names
    list.forEach(invoice => {
        if (invoice.invoiceJson.buyer.toLowerCase().includes(searchTerm)) {
            results.push({ ...invoice, matchType: 'Customer' });
        }
    });

    // Search in supplier names
    list.forEach(invoice => {
        if (invoice.invoiceJson.supplier.toLowerCase().includes(searchTerm)) {
            results.push({ ...invoice, matchType: 'Supplier' });
        }
    });

    // filter repeat ids
    const uniqueResults = results.filter((result, index, self) =>
        index === self.findIndex((t) => t.InvoiceID === result.InvoiceID)
    );

    // Sort by most recently modified and limit results
    const sortedResults = uniqueResults.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
    ).slice(0, maxSearchResults);

    return sortedResults;
};

export { getSearchList, SearchList };