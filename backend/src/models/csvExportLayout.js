const csvExportLayout = (invoice) => {
  const sections = [];

  // Invoice Details Section
  sections.push(['INVOICE DETAILS']);
  sections.push(['Invoice ID:', invoice.invoiceId || 'N/A']);
  sections.push(['Issue Date:', invoice.issueDate || 'N/A']);
  if (invoice.dueDate) {
    sections.push(['Due Date:', invoice.dueDate || 'N/A']);
  }
  sections.push(['Currency:', invoice.currency || 'N/A']);
  sections.push(['']); // Empty line for spacing

  // Payment Information Section
  sections.push(['PAYMENT INFORMATION']);
  sections.push(['Payment Account Name:', invoice.paymentAccountName || 'N/A']);
  sections.push(['Payment Account ID:', invoice.paymentAccountId || 'N/A']);
  sections.push(['Financial Institution Branch:', invoice.financialInstitutionBranchId || 'N/A']);
  sections.push(['Payment Method:', invoice.paymentMethod || 'N/A']);
  sections.push(['']); // Empty line for spacing

  // Buyer Information Section
  sections.push(['BILL TO']);
  sections.push(['Name:', invoice.buyer || 'N/A']);
  sections.push(['Address:', invoice.buyerAddress ? `${invoice.buyerAddress.street}, ${invoice.buyerAddress.country}` : 'N/A']);
  sections.push(['Phone:', invoice.buyerPhone || 'N/A']);
  sections.push(['Email:', invoice.buyerEmail || 'N/A']);
  sections.push(['']); // Empty line for spacing

  // Supplier Information Section
  sections.push(['FROM']);
  sections.push(['Name:', invoice.supplier || 'N/A']);
  sections.push(['Address:', invoice.supplierAddress ? `${invoice.supplierAddress.street}, ${invoice.supplierAddress.country}` : 'N/A']);
  sections.push(['Phone:', invoice.supplierPhone || 'N/A']);
  sections.push(['Email:', invoice.supplierEmail || 'N/A']);
  sections.push(['']); // Empty line for spacing

  // Items Table Header
  sections.push(['ITEMS']);
  sections.push(['Item', 'Description', 'Quantity', 'Unit Price', 'Total']);

  // Items Table Content
  if (invoice.items && invoice.items.length > 0) {
    invoice.items.forEach(item => {
      const itemTotal = parseFloat(item.count) * parseFloat(item.cost);
      sections.push([
        item.name || 'N/A',
        item.description || 'N/A',
        item.count || 'N/A',
        item.cost ? parseFloat(item.cost).toFixed(2) : 'N/A',
        itemTotal.toFixed(2) || 'N/A'
      ]);
    });
  }
  sections.push(['']); // Empty line for spacing

  // Totals Section
  sections.push(['TOTALS']);
  sections.push(['Subtotal:', invoice.total ? parseFloat(invoice.total).toFixed(2) : 'N/A']);
  sections.push([`Tax (${invoice.taxRate || 0}%):`, invoice.taxAmount ? parseFloat(invoice.taxAmount).toFixed(2) : 'N/A']);
  sections.push(['Total:', invoice.totalWithTax ? parseFloat(invoice.totalWithTax).toFixed(2) : 'N/A']);

  // Convert sections to CSV string
  const csvContent = sections.map(section => {
    // For single-column sections (headers and labels), just return the first element
    if (section.length === 1) {
      return section[0];
    }
    // For multi-column sections (items table), join with commas
    return section.map(cell => {
      // Escape cells that contain commas or quotes
      if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(',');
  }).join('\n');

  return csvContent;
};

module.exports = csvExportLayout;
