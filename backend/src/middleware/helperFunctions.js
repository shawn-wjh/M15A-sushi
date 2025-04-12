/**
 * Checks if userId exists in request and compares it with an UserID from an
 * invoice if one is given.
 */
const checkUserId = (userId, invoice) => {
  // if no userId, return false
  if (!userId) {
    return false;
  }

  // if invoice is given, check if userId matches
  if (invoice) {
    return invoice.UserID === userId;
  }

  return true;
};

const UserCanViewInvoice = (userId, invoice, userEmail) => {
  if (checkUserId(userId, invoice)) {
    return true;
  }

  if (invoice.sharedWith) {
    return invoice.sharedWith.includes(userEmail);
  }

  return false;
};

module.exports = { checkUserId, UserCanViewInvoice };
