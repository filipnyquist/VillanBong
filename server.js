const Zettle = require("./zettle");
const Printer = require("./printer");
const logger = require("pino")();
require("dotenv").config(); // Load vars from env file.
let orderId = 0; // Temp var for order IDs.
// Lets setup our API.
let api = new Zettle({
  clientId: process.env.CLIENT_ID,
  assertionToken: process.env.ASSERT_TOKEN,
});
