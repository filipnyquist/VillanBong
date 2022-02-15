const axios = require("axios");
require("dotenv").config(); // Load vars from env file.
const logger = require("pino")({ level: process.env.LOG_LEVEL || "info" });
/**
 * Class for the communication with the Zettle order API.
 */
class Zettle {
  constructor(...args) {
    this.clientId = args[0].clientId;
    this.assertionToken = args[0].assertionToken;
    this.organizationUuid = args[0].organizationUuid || "self";
    this.token = null;
    this.tokenExp = new Date().getTime();
    logger.debug("Initialized Zettle API instance.");
  }

  /**
   * Function to see if the token we have is valid.
   * @returns Always true, grabs a new token if needed.
   */
  async hasValidToken() {
    if (this.tokenExp < new Date().getTime()) {
      logger.debug("Token has expired, getting a new one.");
      await this.getToken();
      return true;
    } else {
      logger.debug("Auth token still valid , using it.");
      return true;
    }
  }
  /**
   * This function grabs token from the Zettle API.
   * @returns True if token was set successfully.
   */
  async getToken() {
    let res = await axios({
      method: "post",
      url: "https://oauth.zettle.com/token",
      data: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&client_id=${this.clientId}&assertion=${this.assertionToken}`,
    });
    this.token = res.data.access_token;
    this.tokenExp = new Date().getTime() + res.data.expires_in * 1000;
    logger.debug("Got back a new token from Zettle, saved it down.");
    return true;
  }
  /**
   * This function grabs the latest orders from the Zettle API.
   * @param {String} limit The amount of orders to fetch.
   * @param {Boolean} descending If they should be sorted by desc.
   * @returns
   */
  async getLatestPurchases(limit, descending) {
    logger.debug(`Grabbing ${limit} latest purchases, desc: ${descending}.`);
    await this.hasValidToken();
    let res = await axios({
      method: "get",
      url: `https://purchase.izettle.com/purchases/v2?limit=${limit}&descending=${descending}`,
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });
    logger.debug(`Got back the latest purchases.`);
    return res.data;
  }
}
module.exports = Zettle;
