const Zettle = require("./zettle");
const Printer = require("./printer");
require("dotenv").config(); // Load vars from env file.
const logger = require("pino")({ level: process.env.LOG_LEVEL || "info" });
let orderId = 0; // Temp var for order IDs.
// Printer stuff
const registerOne = new Printer("tcp://1.1.1.1:9200", "STAR"); // Register one, "Kassa 1".
const registerTwo = new Printer("tcp://1.1.1.1:9200", "STAR"); // Register two, "Kassa 2".
const kitchen = new Printer("tcp://1.1.1.1:9200", "EPSON"); // Printer down in the kitchen, epson printer.
// Lets setup our API.
let api = new Zettle({
  clientId: process.env.CLIENT_ID,
  assertionToken: process.env.ASSERT_TOKEN,
});
// Helper functions
/**
 * Generates a new order ID.
 * @returns {String} An order "ID"
 */
function newOrderId() {
  orderId = (orderId + 1) % 200;
  return ("000000000" + orderId).substr(-3);
}
/**
 * A simple promise based sleep for testing.
 * @param {*} ms The amount of ms to sleep.
 * @returns Promise based sleep.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
// Main functions
/**
 * Handles sending printing task to the different locations.
 * @param {*} order The order to print.
 */
async function printOrder(order) {
  let mergedProducts;
  //Depending on register, select where to print from.
  switch (order.register) {
    case "Kassa 1":
      // This order is from register 1.
      // 1. print cust receipt.
      mergedProducts = order.productsKitchen.concat(order.productsRegister);
      logger.info(
        `[OID: ${order.id}] Priting customer copy at '${
          order.register
        }', following items: ${JSON.stringify(mergedProducts)}`
      );
      await sleep(2000);
      //registerOne.printOrderCustomer(orderId, mergedProducts);
      // 2. print at kitchen if kitcharr >= 1.
      if (order.productsKitchen.length >= 1) {
        logger.info(
          `[OID: ${
            order.id
          }] Priting at 'Kitchen', following items: ${JSON.stringify(
            mergedProducts
          )}`
        );
        await sleep(2000);
        //kitchen.printOrderInternal(registerName, orderId, productsKitchen);
      }
      // 3. print at register if regarr >= 1.
      if (order.productsRegister.length >= 1) {
        logger.info(
          `[OID: ${order.id}] Priting at '${
            order.register
          }', following items: ${JSON.stringify(mergedProducts)}`
        );
        await sleep(2000);
        //kitchen.printOrderInternal(registerName, orderId, productsKitchen);
      }
      break;
    case "Kassa 2":
      // This order is form register 2.
      // 1. print cust receipt.
      mergedProducts = order.productsKitchen.concat(order.productsRegister);
      logger.info(
        `[OID: ${order.id}] Priting customer copy at '${
          order.register
        }', following items: ${JSON.stringify(mergedProducts)}`
      );
      await sleep(2000);
      //registerOne.printOrderCustomer(orderId, mergedProducts);
      // 2. print at kitchen if kitcharr >= 1.
      if (order.productsKitchen.length >= 1) {
        logger.info(
          `[OID: ${
            order.id
          }] Priting at 'Kitchen', following items: ${JSON.stringify(
            mergedProducts
          )}`
        );
        await sleep(2000);
        //kitchen.printOrderInternal(registerName, orderId, productsKitchen);
      }
      // 3. print at register if regarr >= 1.
      if (order.productsRegister.length >= 1) {
        logger.info(
          `[OID: ${order.id}] Priting at '${
            order.register
          }', following items: ${JSON.stringify(mergedProducts)}`
        );
        await sleep(2000);
        //kitchen.printOrderInternal(registerName, orderId, productsKitchen);
      }
      break;
  }
}
/**
 * This function handles incoming orders and sorts the products to kitchen/register.
 * @param {Array} order An order directly from Zettle
 * @returns {Array} A order object made for the printing function.
 */
async function handleIncomingOrder(order) {
  return new Promise((res, rej) => {
    //Get the name of the register. "order.userDisplayName"
    let registerName = order.userDisplayName;
    //Get the products. "order.products"
    let productsKitchen = [];
    let productsRegister = [];
    for (product of order.products) {
      switch (product.name) {
        case "Mat - Köket": // If food from kitchen push to kitchen print.
          productsKitchen.push({
            amnt: product.quantity,
            item: product.variantName,
            extra: product.comment || null,
          });
          break;
        case "Mat - Baren": // If food from the bar push to register print.
          productsRegister.push({
            amnt: product.quantity,
            item: product.variantName,
            extra: product.comment || null,
          });
          break;
      }
    }
    res({
      register: registerName,
      productsKitchen: productsKitchen,
      productsRegister: productsRegister,
    });
  });
}
/**
 * This function calls the Zettle orders API to check for new orders.
 */
async function checkForIncomingOrders() {
  logger.info("Fetching last 5 orders...");
  let ordersToProcess = await api.getLatestPurchases(150, true);
  let toHandle = [];
  for (order of ordersToProcess.purchases) {
    let ord = await handleIncomingOrder(order);
    if (ord.productsKitchen.length > 0 || ord.productsRegister.length > 0) {
      ord.id = newOrderId();
      toHandle.push(ord);
    }
  }
  for (order of toHandle) {
    await printOrder(order);
  }
}
logger.info("Starting OhMyDingDingBong v1.0");

checkForIncomingOrders();
