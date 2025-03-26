const parseInvoiceXml = (xmlString) => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");

    return {
      invoiceId:
        xmlDoc.querySelectorAll("cbc\\:ID, ID")[2]?.textContent || "N/A",
      issueDate:
        xmlDoc.querySelector("cbc\\:IssueDate, IssueDate")?.textContent ||
        "N/A",
      dueDate:
        xmlDoc.querySelector("cbc\\:DueDate, DueDate")?.textContent || "N/A",
      currency:
        xmlDoc.querySelector("cbc\\:DocumentCurrencyCode, DocumentCurrencyCode")
          ?.textContent || "AUD",
      total:
        xmlDoc.querySelector(
          "cac\\:LegalMonetaryTotal cbc\\:PayableAmount, LegalMonetaryTotal PayableAmount"
        )?.textContent || "0.00",
      buyer: {
        name:
          xmlDoc.querySelector(
            "cac\\:AccountingCustomerParty cac\\:Party cac\\:PartyName cbc\\:Name, AccountingCustomerParty Party PartyName Name"
          )?.textContent || "N/A",
        address: {
          street:
            xmlDoc.querySelector(
              "cac\\:AccountingCustomerParty cac\\:Party cac\\:PostalAddress cbc\\:StreetName, AccountingCustomerParty Party PostalAddress StreetName"
            )?.textContent || "N/A",
          country:
            xmlDoc.querySelector(
              "cac\\:AccountingCustomerParty cac\\:Party cac\\:PostalAddress cac\\:Country cbc\\:IdentificationCode, AccountingCustomerParty Party PostalAddress Country IdentificationCode"
            )?.textContent || "AUS",
        },
        phone:
          xmlDoc.querySelector(
            "cac\\:AccountingCustomerParty cac\\:Party cac\\:Contact cbc\\:Telephone, AccountingCustomerParty Party Contact Telephone"
          )?.textContent || "N/A",
      },
      supplier: {
        name:
          xmlDoc.querySelector(
            "cac\\:AccountingSupplierParty cac\\:Party cac\\:PartyName cbc\\:Name, AccountingSupplierParty Party PartyName Name"
          )?.textContent || "N/A",
        address: {
          street:
            xmlDoc.querySelector(
              "cac\\:AccountingSupplierParty cac\\:Party cac\\:PostalAddress cbc\\:StreetName, AccountingSupplierParty Party PostalAddress StreetName"
            )?.textContent || "N/A",
          country:
            xmlDoc.querySelector(
              "cac\\:AccountingSupplierParty cac\\:Party cac\\:PostalAddress cac\\:Country cbc\\:IdentificationCode, AccountingSupplierParty Party PostalAddress Country IdentificationCode"
            )?.textContent || "AUS",
        },
      },
      items: Array.from(
        xmlDoc.querySelectorAll("cac\\:InvoiceLine, InvoiceLine")
      ).map((line) => ({
        name:
          line.querySelector("cac\\:Item cbc\\:Name, Item Name")?.textContent ||
          "N/A",
        count:
          line.querySelector("cbc\\:BaseQuantity, BaseQuantity")?.textContent ||
          "1",
        cost:
          line.querySelector("cac\\:Price cbc\\:PriceAmount, Price PriceAmount")
            ?.textContent || "0.00",
        currency:
          line
            .querySelector("cac\\:Price cbc\\:PriceAmount, Price PriceAmount")
            ?.getAttribute("currencyID") || "AUD",
      })),
    };
  } catch (error) {
    console.error("Error parsing XML:", error);
    return null;
  }
};

export default parseInvoiceXml;
