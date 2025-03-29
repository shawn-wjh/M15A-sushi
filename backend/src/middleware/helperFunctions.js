/**
 * Checks if userId exists in request and compares it with an UserID from an
 * invoice if one is given.
 */
const checkUserId = (userId, invoice) => {
  // no user id
  if (!userId) {
    return false;
  }

  // yes user id no invoice given
  if (!invoice) {
    return true;
  }

  if (invoice.UserID != userId) {
    return false;
  }

  return true;
};

module.exports = { checkUserId };
