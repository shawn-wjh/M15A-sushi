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

module.exports = { checkUserId };
