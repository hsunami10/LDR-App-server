// Regular queries used in multiple areas
const getUserAliases = id => `SELECT id, alias FROM aliases WHERE user_id = '${id}' ORDER BY alias DESC`; // Alphabetical order

module.exports = {
  getUserAliases
}
