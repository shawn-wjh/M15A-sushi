const { schemaNameMap } = require('../utils/schemaNameMap');

const pdfLayout = async (doc, invoice) => {
  doc.setFont('helvetica');
  doc.setFontSize(10);
  doc.setDrawColor(200);

  addHeader(doc, invoice);

  addPaymentInfo(doc, invoice);

  addPartyDetails(doc, invoice);

  await addItemsTable(doc, invoice);

  addTotals(doc, invoice);

  addValidationInfo(doc, invoice);

  addFooter(doc);
};

const pageTop = 30;

const addHeader = (doc, invoice) => {
  const startY = pageTop;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE DETAILS', 20, startY);

  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice ID: ${invoice.invoiceId ? invoice.invoiceId : 'N/A'}`, 20, startY + 10);
  doc.text(`Issue Date: ${invoice.issueDate ? invoice.issueDate : 'N/A'}`, 20, startY + 20);
  if (invoice.dueDate) {
    doc.text(`Due Date: ${invoice.dueDate ? invoice.dueDate : 'N/A'}`, 20, startY + 30);
  }
  doc.text(`Currency: ${invoice.currency ? invoice.currency : 'N/A'}`, 20, startY + 40);

  doc.lastY = startY + 50;
};

const addPaymentInfo = (doc, invoice) => {
  const startY = pageTop;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT INFORMATION', 120, startY);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Payment Account Name:`, 120, startY + 10);
  doc.text(`${invoice.paymentAccountName ? invoice.paymentAccountName : 'N/A'}`, 120, startY + 15);
  doc.line(120, startY + 15 + 1, 190, startY + 15 + 1);
  doc.text(`Payment Account ID:`, 120, startY + 20);
  doc.text(`${invoice.paymentAccountId ? invoice.paymentAccountId : 'N/A'}`, 120, startY + 25);
  doc.line(120, startY + 25 + 1, 190, startY + 25 + 1);
  doc.text(`Financial Institution Branch:`, 120, startY + 30);
  doc.text(`${invoice.financialInstitutionBranchId ? invoice.financialInstitutionBranchId : 'N/A'}`, 120, startY + 35);
  doc.line(120, startY + 35 + 1, 190, startY + 35 + 1);

  doc.lastY = startY + 50;  

  doc.line(20, doc.lastY, 190, doc.lastY);
};

const addPartyDetails = (doc, invoice) => {
  let y = doc.lastY + 10;

  // Buyer
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  
  doc.text('BILL TO', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.buyer ? invoice.buyer : 'N/A', 20, y + 10);
  doc.text(invoice.buyerAddress.street ? invoice.buyerAddress.street : 'N/A', 20, y + 20);
  doc.text(invoice.buyerAddress.country ? invoice.buyerAddress.country : 'N/A', 20, y + 30);
  doc.text(`Phone: ${invoice.buyerPhone ? invoice.buyerPhone : 'N/A'}`, 20, y + 40);
  doc.text(`Email: ${invoice.buyerEmail ? invoice.buyerEmail : 'N/A'}`, 20, y + 50);
  
  // Supplier
  doc.setFont('helvetica', 'bold');
  doc.text('FROM', 120, y);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.supplier ? invoice.supplier : 'N/A', 120, y + 10);
  doc.text(invoice.supplierAddress.street ? invoice.supplierAddress.street : 'N/A', 120, y + 20);
  doc.text(invoice.supplierAddress.country ? invoice.supplierAddress.country : 'N/A', 120, y + 30);
  doc.text(`Phone: ${invoice.supplierPhone ? invoice.supplierPhone : 'N/A'}`, 120, y + 40);
  doc.text(`Email: ${invoice.supplierEmail ? invoice.supplierEmail : 'N/A'}`, 120, y + 50);
  
  doc.lastY = y + 60;
  doc.line(20, doc.lastY, 190, doc.lastY);
};

const addItemsTable = async (doc, invoice) => {
  const startY = doc.lastY + 10;
  const tableHeaders = ['Item', 'Description', 'Quantity', `Unit Price`, `Total`];
  const columnWidths = [20, 80, 30, 30, 30];
  const columnPositions = [20, 40, 120, 150, 180];
  const rowHeight = 8;
  const maxRowsPerPage = Math.floor((doc.internal.pageSize.height - startY - 50) / rowHeight);

  // Draw table headers
  doc.setFont('helvetica', 'bold');
  let x = 20;
  tableHeaders.forEach((header, i) => {
    doc.text(header, x, startY);
    x += columnWidths[i];
  });

  // Draw header separator line
  doc.setDrawColor(200);
  doc.line(20, startY + 2, 190, startY + 2);

  // Draw table rows with pagination
  doc.setFont('helvetica', 'normal');
  let y = startY + 10;
  let rowsOnCurrentPage = 0;

  for (let i = 0; i < invoice.items.length; i++) {
    const item = invoice.items[i];
    const itemTotal = parseFloat(item.count) * parseFloat(item.cost);
    
    // Check if we need a new page
    if (rowsOnCurrentPage >= maxRowsPerPage) {
      doc.addPage();
      y = 40; // Reset Y position for new page
      rowsOnCurrentPage = 0;
      
      // Redraw headers on new page
      doc.setFont('helvetica', 'bold');
      x = 20;
      tableHeaders.forEach((header, j) => {
        doc.text(header, x, y - 10);
        x += columnWidths[j];
      });
      doc.line(20, y - 8, 190, y - 8);
      doc.setFont('helvetica', 'normal');
    }
    
    doc.text((i + 1).toString(), columnPositions[0], y);
    doc.text(item.name ? item.name : 'N/A', columnPositions[1], y);
    doc.text(item.count ? item.count.toString() : 'N/A', columnPositions[2], y);
    doc.text(item.cost ? `${parseFloat(item.cost).toFixed(2)}` : 'N/A', columnPositions[3], y);
    doc.text(itemTotal ? `${itemTotal.toFixed(2)}` : 'N/A', columnPositions[4], y);
    
    // Add row separator line
    doc.line(20, y + 2, 190, y + 2);
    y += rowHeight;
    rowsOnCurrentPage++;
  }

  // Store the last Y position for subsequent elements
  doc.lastY = y;
};

const addTotals = (doc, invoice) => {
  const startY = doc.lastY + 10;
  const subtotal = parseFloat(invoice.total);
  const taxAmount = parseFloat(invoice.taxAmount);
  const total = parseFloat(invoice.totalWithTax);

  doc.setFont('helvetica', 'bold');
  doc.text('Subtotal:', 150, startY);
  doc.text(subtotal ? `${subtotal.toFixed(2)}` : 'N/A', 180, startY);

  doc.text(`Tax (${invoice.taxRate}%):`, 150, startY + 10);
  doc.text(taxAmount ? `${taxAmount.toFixed(2)}` : 'N/A', 180, startY + 10);

  doc.setFontSize(12);
  doc.text('Total:', 150, startY + 20);
  doc.text(total ? `${total.toFixed(2)}` : 'N/A', 180, startY + 20);
  
  doc.lastY = startY + 30;
};

const addValidationInfo = (doc, invoice) => {
  if (invoice.validatedSchemas && invoice.validatedSchemas.length > 0) {
    const startY = doc.lastY + 10;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Validated Against:', 20, startY);

    doc.setFont('helvetica', 'normal');
    invoice.validatedSchemas.forEach((schema, index) => {
      doc.text(schemaNameMap[schema], 20, startY + 10 + index * 5);
    });
    
    doc.lastY = startY + 10 + invoice.validatedSchemas.length * 5;
  }
};

const addFooter = (doc) => {
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for your business!', 20, pageHeight - 20);
  doc.text('This is a computer-generated invoice.', 20, pageHeight - 15);
  doc.text('© 2025 Sushi. All rights reserved.', 20, pageHeight - 10);
};

module.exports = pdfLayout;
