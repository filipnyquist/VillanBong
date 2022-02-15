const axios = require("axios");
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
  }

  /**
   * Function to see if the token we have is valid.
   * @returns Always true, grabs a new token if needed.
   */
  async hasValidToken() {
    if (this.tokenExp < new Date().getTime()) {
      await this.getToken();
      return true;
    } else {
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
    return true;
  }
  /**
   * This function grabs the latest orders from the Zettle API.
   * @param {String} limit The amount of orders to fetch.
   * @param {Boolean} descending If they should be sorted by desc.
   * @returns
   */
  async getLatestPurchases(limit, descending) {
    await this.hasValidToken();
    let res = await axios({
      method: "get",
      url: `https://purchase.izettle.com/purchases/v2?limit=${limit}&descending=${descending}`,
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });
    return res.data;
  }
}
module.exports = Zettle;
