import React, { useState, useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import apiClient from '../utils/axiosConfig';
import './Dashboard.css';
// Import icons - assuming we'll use Font Awesome or similar
// If not available, we'll need to add the package
import InvoiceForm from './InvoiceForm';
import InvoiceList from './invoiceList/InvoiceList';
import AppLayout from './AppLayout';
import PeppolSettings from './PeppolSettings';
import AccountInformation from './settings/AccountInformation';
import Chart from 'chart.js/auto';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [activeSection, setActiveSection] = useState(location.state?.section || 'overview');
  const history = useHistory();
  const [activeSettingsTab, setActiveSettingsTab] = useState('peppol');
  const [invoiceStats, setInvoiceStats] = useState({
    totalInvoices: 0,
    paidInvoices: 18,
    pendingInvoices: 6,
    totalRevenue: '$3,240'
  });
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Chart references - moved to component level
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  
  // Pie chart references
  const pieChartRef = useRef(null);
  const pieChartInstance = useRef(null);

  // Parse URL query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    const settingsParam = searchParams.get('settings');
    
    if (tabParam === 'settings') {
      setActiveSection('settings');
      
      if (settingsParam) {
        setActiveSettingsTab(settingsParam);
      }
    }
  }, [location.search]);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      history.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setLoading(false);
      
      // Fetch invoice statistics once user is authenticated
      fetchInvoiceStats();
    } catch (e) {
      console.error('Failed to parse user data');
      history.push('/login');
    }
  }, [history]);

  // Function to fetch invoice statistics
  const fetchInvoiceStats = async () => {
    try {
      setStatsLoading(true);
      // Fetch all invoices to get totals and validation status
      const response = await apiClient.get('/v1/invoices/list', {
        params: {
          limit: 1000, // Get all invoices to count validation status
          offset: 0
        }
      });

      if (response?.data?.data) {
        const totalCount = response.data.data.count;
        const invoices = response.data.data.invoices || [];
        console.log('Total invoices fetched:', invoices.length);
        
        // Count validated invoices
        const validatedCount = invoices.filter(invoice => invoice.valid === true).length;
        
        // Count invoices pending validation
        const pendingValidationCount = invoices.filter(invoice => invoice.valid !== true).length;
        
        // Calculate total revenue by currency
        const revenueByCurrency = {};
        
        // Get the last 5 days (including today)
        const today = new Date();
        console.log('Today:', today);
        
        const last5Days = Array.from({ length: 5 }, (_, index) => {
          const date = new Date(today);
          date.setDate(date.getDate() - index);
          return date;
        }).reverse(); // Reverse so it's in chronological order
        
        console.log('Last 5 days:', last5Days.map(d => d.toISOString()));
        
        // Initialize count for each day
        const dailyInvoiceCounts = last5Days.map(date => ({
          date,
          count: 0,
          displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
        }));
        
        console.log('Initial daily counts:', JSON.stringify(dailyInvoiceCounts));
        
        // Parse each invoice to get the amount, currency, and date
        for (const invoice of invoices) {
          try {
            // Get timestamp from invoice
            if (invoice.timestamp) {
              const invoiceDate = new Date(invoice.timestamp);
              console.log('Invoice time:', invoice.timestamp, 'parsed as:', invoiceDate);
              
              // Find the corresponding day in our dates array
              for (let i = 0; i < last5Days.length; i++) {
                const dayStart = new Date(last5Days[i]);
                dayStart.setHours(0, 0, 0, 0);
                
                const dayEnd = new Date(last5Days[i]);
                dayEnd.setHours(23, 59, 59, 999);
                
                if (invoiceDate >= dayStart && invoiceDate <= dayEnd) {
                  dailyInvoiceCounts[i].count++;
                  break;
                }
              }
            }
            
            // Try to get invoice data from the parsedXML in backend response
            if (invoice.parsedData && invoice.parsedData.TotalPayableAmount) {
              const amount = parseFloat(invoice.parsedData.TotalPayableAmount);
              // Default to AUD as currency if not available
              const currency = 'AUD';

              if (!isNaN(amount)) {
                if (!revenueByCurrency[currency]) {
                  revenueByCurrency[currency] = 0;
                }
                revenueByCurrency[currency] += amount;
              }
            }
            // If no parsedData or we couldn't extract total, try parsing the XML directly
            else if (invoice.invoice) {
              // Parse the invoice XML to get total and currency
              const parser = new DOMParser();
              const xmlDoc = parser.parseFromString(invoice.invoice, "text/xml");
              
              // Extract currency and total from the XML
              const currency = xmlDoc.querySelector("cbc\\:DocumentCurrencyCode, DocumentCurrencyCode")?.textContent || "AUD";
              const totalElement = xmlDoc.querySelector("cac\\:LegalMonetaryTotal cbc\\:PayableAmount, LegalMonetaryTotal PayableAmount");
              
              if (totalElement) {
                const amount = parseFloat(totalElement.textContent);
                if (!isNaN(amount)) {
                  if (!revenueByCurrency[currency]) {
                    revenueByCurrency[currency] = 0;
                  }
                  revenueByCurrency[currency] += amount;
                }
              }
            }
          } catch (error) {
            console.error('Error processing invoice:', error);
          }
        }
        
        console.log('Final daily counts:', JSON.stringify(dailyInvoiceCounts));
        
        // Format the revenue data for display
        let formattedRevenue;
        const currencies = Object.keys(revenueByCurrency);
        
        if (currencies.length === 0) {
          formattedRevenue = '$0.00';
        } else if (currencies.length === 1) {
          // Single currency case
          const currency = currencies[0];
          formattedRevenue = `${currency} ${revenueByCurrency[currency].toFixed(2)}`;
        } else {
          // Multiple currencies case - join them with line breaks
          formattedRevenue = currencies
            .map(currency => `${currency} ${revenueByCurrency[currency].toFixed(2)}`)
            .join(' | ');
        }
        
        setInvoiceStats(prevStats => ({
          ...prevStats,
          totalInvoices: totalCount,
          paidInvoices: validatedCount,
          pendingInvoices: pendingValidationCount,
          totalRevenue: formattedRevenue,
          dailyActivity: dailyInvoiceCounts
        }));
      }
    } catch (error) {
      console.error('Failed to fetch invoice statistics:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Update activeSection when location state changes
  useEffect(() => {
    if (location.state?.section) {
      setActiveSection(location.state.section);
    }
  }, [location.state]);

  // Add useEffect to handle location state
  useEffect(() => {
    if (location.state?.fromShared) {
      setActiveSection('shared-invoices');
    }
  }, [location.state]);

  // Chart.js rendering effect - moved from renderOverviewSection to component level
  useEffect(() => {
    if (statsLoading || !invoiceStats.dailyActivity || !chartRef.current || activeSection !== 'overview') {
      return;
    }
    
    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    // Get the chart canvas context
    const ctx = chartRef.current.getContext('2d');
    
    // Prepare data for Chart.js
    const labels = invoiceStats.dailyActivity.map(day => day.displayDate);
    const data = invoiceStats.dailyActivity.map(day => day.count);
    
    // Create new chart
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Daily Invoices',
          data: data,
          borderColor: '#ff3b30',
          backgroundColor: 'rgba(255, 59, 48, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          pointBackgroundColor: '#ff3b30',
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#222',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#333',
            borderWidth: 1,
            padding: 10,
            displayColors: false,
            callbacks: {
              title: (tooltipItems) => {
                return tooltipItems[0].label;
              },
              label: (context) => {
                return `Invoices: ${context.parsed.y}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
            },
            ticks: {
              color: '#888888'
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
            },
            ticks: {
              color: '#888888',
              precision: 0,
              stepSize: 1
            }
          }
        }
      }
    });
  }, [statsLoading, invoiceStats.dailyActivity, activeSection]);

  // Pie chart render effect
  useEffect(() => {
    if (statsLoading || !pieChartRef.current || activeSection !== 'overview') {
      return;
    }
    
    // Destroy previous chart instance if it exists
    if (pieChartInstance.current) {
      pieChartInstance.current.destroy();
    }

    const ctx = pieChartRef.current.getContext('2d');
    
    // Calculation for pie chart data
    const validatedPercentage = invoiceStats.totalInvoices > 0 
      ? Math.round(invoiceStats.paidInvoices / invoiceStats.totalInvoices * 100) 
      : 0;
    
    const pendingPercentage = invoiceStats.totalInvoices > 0 
      ? Math.round(invoiceStats.pendingInvoices / invoiceStats.totalInvoices * 100) 
      : 0;
    
    // Create pie chart
    pieChartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Validated', 'Pending'],
        datasets: [{
          data: [invoiceStats.paidInvoices, invoiceStats.pendingInvoices],
          backgroundColor: ['#ff3b30', '#ffcc00'],
          borderColor: ['#ff3b30', '#ffcc00'],
          borderWidth: 1,
          hoverOffset: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            display: false // We handle legend separately in our component
          },
          tooltip: {
            backgroundColor: '#222',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#333',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.raw || 0;
                const percentage = invoiceStats.totalInvoices > 0 
                  ? Math.round((value / invoiceStats.totalInvoices) * 100) 
                  : 0;
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
    
  }, [statsLoading, invoiceStats.paidInvoices, invoiceStats.pendingInvoices, invoiceStats.totalInvoices, activeSection]);

  // Cleanup chart when component unmounts
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      if (pieChartInstance.current) {
        pieChartInstance.current.destroy();
      }
    };
  }, []);

  const handleLogout = () => {
    // Clear user data
    localStorage.removeItem('user');
    // Clear auth cookie
    document.cookie = 'token=; Max-Age=0; path=/; SameSite=Lax';
    // Redirect to login
    history.push('/login');
  };

  const handleCreateInvoice = () => {
    // Redirect to the invoice selection page
    history.push('/invoices/create-selection');
  };

  const handleViewInvoices = () => {
    // Set active section to invoices instead of redirecting
    setActiveSection('invoices');
  };

  const renderActiveSectionContent = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileSection();
      case 'overview':
        return renderOverviewSection();
      case 'invoices':
        return renderInvoiceListSection();
      case 'shared-invoices':
        return renderSharedInvoicesSection();
      case 'createInvoice':
        // Redirect to the invoice selection page
        history.push('/invoices/create-selection');
        return null;
      case 'settings':
        return renderSettingsSection();
      default:
        return renderOverviewSection();
    }
  };

  // New method to render the Create Invoice section
  const renderCreateInvoiceSection = () => {
    return (
      <div className="create-invoice-section">
        <h2>Create Invoice</h2>
        <InvoiceForm />
      </div>
    );
  };

  // New method to render the Invoice List section
  const renderInvoiceListSection = () => {
    return (
      <div className="invoice-list-section">
        <InvoiceList />
      </div>
    );
  };

  const renderSharedInvoicesSection = () => {
    return (
      <div className="invoice-list-section">
        <InvoiceList displaySharedInvoices={true} />
      </div>
    );
  };

  const renderProfileSection = () => {
    return (
      <div className="profile-section">
        <h2>Profile Information</h2>
        
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {user?.name ? user.name[0].toUpperCase() : user?.email[0].toUpperCase()}
            </div>
            <div className="profile-name">
              <h3>{user?.name || 'User'}</h3>
              <p>{user?.email}</p>
            </div>
          </div>
          
          <div className="profile-details">
            <div className="profile-detail-item">
              <div className="detail-label">Email</div>
              <div className="detail-value">{user?.email}</div>
            </div>
            
            <div className="profile-detail-item">
              <div className="detail-label">Name</div>
              <div className="detail-value">{user?.name || 'Not provided'}</div>
            </div>
            
            <div className="profile-detail-item">
              <div className="detail-label">User ID</div>
              <div className="detail-value">{user?.UserID || user?.userId || user?._id || 'Not available'}</div>
            </div>
            
            <div className="profile-detail-item">
              <div className="detail-label">Account Type</div>
              <div className="detail-value">{user?.role || 'Standard User'}</div>
            </div>
            
            {user?.createdAt && (
              <div className="profile-detail-item">
                <div className="detail-label">Member Since</div>
                <div className="detail-value">{new Date(user.createdAt).toLocaleDateString()}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderOverviewSection = () => {      
    // Calculate percentages for the pie chart
    const validatedPercentage = invoiceStats.totalInvoices > 0 
      ? Math.round(invoiceStats.paidInvoices / invoiceStats.totalInvoices * 100) 
      : 0;
    
    const pendingPercentage = invoiceStats.totalInvoices > 0 
      ? Math.round(invoiceStats.pendingInvoices / invoiceStats.totalInvoices * 100) 
      : 0;
      
    return (
      <div className="overview-section">
        <div className="overview-header">
          <h2>Dashboard Overview</h2>
          <div className="time-filter">
            <button className="time-filter-btn active">Today</button>
            <button className="time-filter-btn">This Week</button>
            <button className="time-filter-btn">This Month</button>
            <button className="time-filter-btn">This Year</button>
          </div>
        </div>
        
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon total-invoices-icon"></div>
              <div className="stat-trend positive">
                <span>+12%</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 14L12 9L17 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-value">
                {statsLoading ? (
                  <span className="loading-indicator">...</span>
                ) : (
                  <span className="animate-value">{invoiceStats.totalInvoices}</span>
                )}
              </div>
              <div className="stat-label">Total Invoices</div>
              <div className="stat-subtitle">From all accounts</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon validated-icon"></div>
              <div className="stat-trend positive">
                <span>+8%</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 14L12 9L17 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-value">
                {statsLoading ? (
                  <span className="loading-indicator">...</span>
                ) : (
                  <span className="animate-value">{invoiceStats.paidInvoices}</span>
                )}
              </div>
              <div className="stat-label">Validated Invoices</div>
              <div className="stat-subtitle">Successfully processed</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon pending-icon"></div>
              <div className="stat-trend negative">
                <span>-3%</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-value">
                {statsLoading ? (
                  <span className="loading-indicator">...</span>
                ) : (
                  <span className="animate-value">{invoiceStats.pendingInvoices}</span>
                )}
              </div>
              <div className="stat-label">Invoices Pending Validation</div>
              <div className="stat-subtitle">Awaiting processing</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon revenue-icon"></div>
              <div className="stat-trend positive">
                <span>+15%</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 14L12 9L17 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-value">
                {statsLoading ? (
                  <span className="loading-indicator">...</span>
                ) : (
                  <span className="animate-value">{invoiceStats.totalRevenue}</span>
                )}
              </div>
              <div className="stat-label">Total Revenue</div>
              <div className="stat-subtitle">Across all invoices</div>
            </div>
          </div>
        </div>
        
        <div className="chart-container">
          <div className="chart-card">
            <div className="chart-card-header">
              <h3>Daily Invoice Activity</h3>
              <div className="chart-actions">
                <button className="chart-action-btn active">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button className="chart-action-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button className="chart-action-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
            {statsLoading ? (
              <div className="chart-loading">
                <div className="chart-loading-spinner"></div>
                <span>Loading chart data...</span>
              </div>
            ) : (
              <div className="chart-body">
                <canvas ref={chartRef} height="250"></canvas>
              </div>
            )}
          </div>
          
          <div className="chart-card">
            <div className="chart-card-header">
              <h3>Invoice Status</h3>
              <select className="chart-period-selector">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
                <option>This Year</option>
              </select>
            </div>
            {statsLoading ? (
              <div className="chart-loading">
                <div className="chart-loading-spinner"></div>
                <span>Loading chart data...</span>
              </div>
            ) : (
              <div className="chart-body">
                <div className="pie-chart-container">
                  <canvas ref={pieChartRef} height="200"></canvas>
                  
                  {invoiceStats.totalInvoices > 0 && (
                    <div className="pie-chart-total">
                      <div className="total-value">{invoiceStats.totalInvoices}</div>
                      <div className="total-label">Total</div>
                    </div>
                  )}
                  
                  <div className="pie-chart-labels">
                    <div className="pie-chart-label validated-label">
                      <div className="label-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 6L9 17L4 12" stroke="#ff3b30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div className="label-content">
                        <div className="label-percentage">{validatedPercentage}%</div>
                        <div className="label-text">Validated</div>
                      </div>
                    </div>
                    <div className="pie-chart-label pending-label">
                      <div className="label-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#ffcc00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 6V12L16 14" stroke="#ffcc00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div className="label-content">
                        <div className="label-percentage">{pendingPercentage}%</div>
                        <div className="label-text">Pending</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="recent-activity-section">
          <div className="section-header">
            <h3>Recent Activity</h3>
            <button className="view-all-btn">View All</button>
          </div>
          <div className="activity-list">
            <div className="activity-item new">
              <div className="activity-icon created"></div>
              <div className="activity-content">
                <div className="activity-title">Invoice #1234 created</div>
                <div className="activity-time">Today, 10:30 AM</div>
              </div>
              <div className="activity-amount">$230.00</div>
            </div>
            <div className="activity-item">
              <div className="activity-icon validated"></div>
              <div className="activity-content">
                <div className="activity-title">Invoice #1230 validated</div>
                <div className="activity-time">Yesterday, 2:15 PM</div>
              </div>
              <div className="activity-amount">$495.85</div>
            </div>
            <div className="activity-item">
              <div className="activity-icon sent"></div>
              <div className="activity-content">
                <div className="activity-title">Invoice #1228 sent</div>
                <div className="activity-time">Yesterday, 11:20 AM</div>
              </div>
              <div className="activity-amount">$1,200.00</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSettingsSection = () => {
    return (
      <div className="settings-section">
        <h2>Account Settings</h2>
        
        <div className="settings-tabs">
          <button 
            className={`tab-button ${activeSettingsTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveSettingsTab('account')}
          >
            Account Information
          </button>
          <button 
            className={`tab-button ${activeSettingsTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveSettingsTab('security')}
          >
            Security
          </button>
          <button 
            className={`tab-button ${activeSettingsTab === 'peppol' ? 'active' : ''}`}
            onClick={() => setActiveSettingsTab('peppol')}
          >
            Peppol Integration
          </button>
        </div>
        
        <div className="settings-content">
          {activeSettingsTab === 'peppol' && <PeppolSettings />}
          
          {activeSettingsTab === 'account' && (
            <AccountInformation 
              user={user} 
              onUserUpdate={(updatedUser) => {
                setUser(updatedUser);
              }}
            />
          )}
          
          {activeSettingsTab === 'security' && (
            <div className="settings-placeholder">
              <div className="settings-option">
                <h3>Password Management</h3>
                <p>Change your password to maintain account security</p>
                <form autoComplete="off" method="post">
                  {/* Hidden field to prevent autofill */}
                  <input type="text" name="username" style={{ display: 'none' }} />
                  <input type="password" name="password" style={{ display: 'none' }} />
                  
                  <div className="form-field" style={{ marginTop: '20px' }}>
                    <label htmlFor="current-password">Current Password</label>
                    <input 
                      type="password" 
                      id="current-password" 
                      name="current-password"
                      placeholder="Enter your current password" 
                      autoComplete="off"
                      className="settings-input"
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="new-password">New Password</label>
                    <input 
                      type="password" 
                      id="new-password" 
                      name="new-password"
                      placeholder="Enter your new password" 
                      autoComplete="off"
                      className="settings-input"
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="confirm-password">Confirm New Password</label>
                    <input 
                      type="password" 
                      id="confirm-password" 
                      name="confirm-password"
                      placeholder="Confirm your new password" 
                      autoComplete="off"
                      className="settings-input"
                    />
                  </div>
                  <button type="button" className="settings-save-button">
                    Update Password
                  </button>
                </form>
              </div>
              
              <div className="settings-option">
                <h3>Two-Factor Authentication</h3>
                <p>Add an extra layer of security to your account</p>
                
                <div style={{ marginTop: '20px' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>
                      Status: <span style={{ color: '#ff4b4b' }}>Disabled</span>
                    </div>
                    <div style={{ color: '#a0a0a0', fontSize: '14px', marginBottom: '16px' }}>
                      Enhance your account security by enabling 2FA
                    </div>
                    <button className="settings-save-button" style={{ marginTop: '0' }}>
                      Enable
                    </button>
                  </div>
                </div>
                
                <div style={{ marginTop: '30px' }}>
                  <h3>Session Management</h3>
                  <p>Sign out from all other devices</p>
                  
                  <div style={{ marginTop: '16px' }}>
                    <button 
                      className="settings-save-button" 
                      style={{ 
                        backgroundColor: 'transparent', 
                        border: '1px solid #ff4b4b', 
                        color: '#ff4b4b', 
                        marginTop: '0'
                      }}
                    >
                      Sign out everywhere
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        Loading...
      </div>
    );
  }

  return (
    <AppLayout activeSection={activeSection}>
      {renderActiveSectionContent()}
    </AppLayout>
  );
};

export default Dashboard; 