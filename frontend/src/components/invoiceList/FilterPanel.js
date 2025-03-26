import React from 'react';
import './InvoiceList.css';

const FilterPanel = ({ 
  isFilterPanelOpen, 
  setIsFilterPanelOpen, 
  filters, 
  handleFilterChange,
  handleExpandAll,
  handleCollapseAll 
}) => {
  return (
    <div className="filter-panel">
      <div
        className="filter-panel-header"
        onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 className="filter-panel-title">Filter & Sort</h2>
        <span
          style={{
            transform: isFilterPanelOpen ? "rotate(180deg)" : "none",
            transition: "transform 0.3s ease",
          }}
        >
          ▼
        </span>
      </div>

      {isFilterPanelOpen && (
        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="sort">Sort By</label>
            <select
              id="sort"
              name="sort"
              value={filters.sort}
              onChange={handleFilterChange}
            >
              <option value="issuedate">Issue Date</option>
              <option value="duedate">Due Date</option>
              <option value="total">Total Amount</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="order">Order</label>
            <select
              id="order"
              name="order"
              value={filters.order}
              onChange={handleFilterChange}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="limit">Items Per Page</label>
            <select
              id="limit"
              name="limit"
              value={filters.limit}
              onChange={handleFilterChange}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>

          <div className="filter-group">
            <label>View Options</label>
            <div className="view-options">
              <button
                className="view-option-button"
                onClick={handleExpandAll}
              >
                Expand All
              </button>
              <button
                className="view-option-button"
                onClick={handleCollapseAll}
              >
                Collapse All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
