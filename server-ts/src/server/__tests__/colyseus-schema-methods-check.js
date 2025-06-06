const { Trade } = require('../game/EntitySchemas.js');
const trade = new Trade('test_trade', 'proposer', 'accepter');
console.log('Trade prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(trade)));
