require("dotenv").config(); // Load vars from env file.
const logger = require("pino")({ level: process.env.LOG_LEVEL || "info" });
const ThermalPrinter = require("node-thermal-printer").printer;
const PrinterTypes = require("node-thermal-printer").types;
const { createCanvas } = require("canvas");

class Printer {
  /** Node.JS compatible thermal printer module for Villans printers.
   *
   * @param {String} netPath netPath of the printer, in format "tcp://X.X.X.X:XXXX"
   * @param {String} type The type of printer, EPSON or STAR.
   */
  constructor(netPath, type) {
    this.netPath = netPath;
    this.printerType = PrinterTypes[type];
    this.printer = new ThermalPrinter({
      type: printerType, // Printer type: 'star' or 'epson'
      netPath: netPath, // Printer netPath
      characterSet: "PC865_NORDIC", // Printer character set - ISO8859_15_LATIN9
      removeSpecialCharacters: false, // Removes special characters - default: false
      lineCharacter: "=", // Set character for lines - default: "-"
      options: {
        // Additional options
        timeout: 5000, // Connection timeout (ms) [applicable only for network printers] - default: 3000
      },
      width: 48,
    });
    logger.info(`Initialized printer interace at netPath ${netPath}`);
  }
  /** Generates a picture "MAX-style" of the order id supplied.
   *
   * @param {*} id The number to print on the order.
   * @returns {Buffer} The png buffer of the picture.
   */
  async genPicOrderId(id) {
    logger.debug(`Generating order image for order ${id}`);
    width = 400;
    height = 100;
    canvas = createCanvas(width, height);
    context = canvas.getContext("2d");
    context.fillStyle = "#00000";
    context.fillRect(0, 0, width, height);
    yourOrder = "Your order number is";
    context.font = "bold 15pt Menlo";
    context.textAlign = "center";
    context.fillStyle = "#fff";
    context.fillText(yourOrder, 200, 20);
    context.font = "bold 50pt Menlo";
    context.textAlign = "center";
    context.fillStyle = "#fff";
    context.fillText(id, 200, 85);
    buffer = canvas.toBuffer("image/png");
    logger.debug(`Done with image for order ${id}, sending buffer.`);
    return buffer;
  }
  /** Prints a receipt/bong for customer with the orderId and items supplied.
   *
   * @param {String} orderId The id of the current order.
   * @param {Array} itemsInOrder An array of items to print in the format [{item: 'Test', amnt: 1, extra: 'Extra comment.'}]
   * @returns {Boolean} Returns true if the print was successful, else false.
   */
  async printOrderCustomer(orderId, itemsInOrder) {
    logger.debug(`Printing receipt for customer, order id ${orderId}`);
    try {
      date = new Date();
      this.printer.clear();
      this.printer.setTypeFontA();
      this.printer.bold(true);
      this.printer.alignLeft();
      this.printer.println("--------------------------------");
      this.printer.alignCenter();
      this.printer.println("Studentpuben Villan");
      this.printer.println("Food order");
      this.printer.alignLeft();
      this.printer.println("--------------------------------");
      this.printer.println("Thanks for your order!");
      this.printer.println();
      this.printer.println("You ordered:");
      for (item of itemsInOrder) {
        this.printer.println(`${item.amnt}x ${item.item}`);
        if (item.extra) {
          this.printer.println(`    *${item.extra}`);
        }
      }
      this.printer.println();
      this.printer.println(
        "Sent to kitchen: " + date.getHours() + ":" + date.getMinutes()
      );
      await this.printer.printImageBuffer(await genPicOrderId(orderId));
      this.printer.cut();
      this.printer.execute();
      logger.debug(
        `Done with printing receipt for customer, order id ${orderId}`
      );
      return true;
    } catch (err) {
      logger.debug("Error while trying to print:" + err);
      return false;
    }
  }
  /** Prints a receipt/bong for kitchen/register with the orderId and items supplied.
   *
   * @param {String} orderLoc The POS system location of the current order.
   * @param {String} orderId The id of the current order.
   * @param {Array} itemsInOrder An array of items to print in the format [{item: 'Test', amnt: 1, extra: 'Extra comment.'}]
   * @returns {Boolean} Returns true if the print was successful, else false.
   */
  async printOrderInternal(orderLoc, orderId, itemsInOrder) {
    logger.debug(`Printing receipt for kitchen, order id ${orderId}`);
    try {
      date = new Date();
      this.printer.clear();
      this.printer.setTypeFontA();
      this.printer.bold(true);
      this.printer.alignLeft();
      this.printer.println("--------------------------------");
      this.printer.alignCenter();
      this.printer.setTextQuadArea();
      this.printer.println("Food order");
      this.printer.setTextNormal();
      this.printer.alignLeft();
      this.printer.println("--------------------------------");
      this.printer.println("CUSTOMER BOUGHT THE FOLLOWING:");
      this.printer.println();
      for (item of itemsInOrder) {
        this.printer.println(`${item.amnt}x ${item.item}`);
        if (item.extra) {
          this.printer.println(`    *${item.extra}`);
        }
      }
      this.printer.println();
      this.printer.println("ORDER LOCATION: " + orderLoc);
      this.printer.println(
        "GOT ORDER AT: " + date.getHours() + ":" + date.getMinutes()
      );
      this.printer.bold(true);
      this.printer.setTextQuadArea();
      this.printer.alignCenter();
      this.printer.println("ORDER NUMBER");
      this.printer.println(orderId);
      this.printer.cut();
      this.printer.execute();
      logger.debug(
        `Done with printing receipt for kitchen, order id ${orderId}`
      );
      return true;
    } catch (err) {
      logger.debug("Error while trying to print:" + err);
      return false;
    }
  }
}

module.exports = Printer;
