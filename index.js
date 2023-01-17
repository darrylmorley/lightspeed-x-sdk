import axios from "axios";

// Cost per operation
const getRequestUnits = (operation) => {
  switch (operation) {
    case "GET":
      return 1;
    case "POST":
      return 10;
    case "PUT":
      return 10;
    default:
      return 10;
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class LightspeedRetail {
  constructor(opts) {
    const { clientID, clientSecret, refreshToken, accountID } = opts;

    this.clientID = clientID;
    this.clientsecret = clientSecret;
    this.refreshToken = refreshToken;
    this.accountID = accountID;
    this.baseUrl = "https://api.lightspeedapp.com/API/V3/Account/";
    this.maxRetries = 3;
    this.lastResponse = null;
  }

  handleError(msg, err) {
    console.error(`${msg} - ${err}`);
    throw err;
  }

  setLastResponse = (response) => (this.lastResponse = response);

  handleRateLimit = async (options) => {
    if (!this.lastResponse) return null;

    const { method } = options;

    const requestUnits = getRequestUnits(method);
    const rateHeader = this.lastResponse.headers["x-ls-api-bucket-level"];

    if (!rateHeader) return null;

    const [used, available] = rateHeader.split("/");
    const availableUnits = available - used;
    if (requestUnits <= availableUnits) return 0;

    const dripRate = this.lastResponse.headers["x-ls-api-drip-rate"];
    const unitWait = requestUnits - availableUnits;
    const delay = Math.ceil((unitWait / dripRate) * 1000);
    await sleep(delay);

    return unitWait;
  };

  getToken = async () => {
    const url = `https://cloud.lightspeedapp.com/oauth/access_token.php`;

    const body = {
      grant_type: "refresh_token",
      client_id: this.clientID,
      client_secret: this.clientsecret,
      refresh_token: this.refreshToken,
    };

    try {
      const res = await axios({
        url,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        data: JSON.stringify(body),
      });
      console.log(res.data.access_token);
      return res.data.access_token;
    } catch (err) {
      return this.handleError("GET TOKEN", err);
    }
  };

  getResource = async (options, url, retries = 0) => {
    this.handleRateLimit(options);

    const token = await this.getToken();

    console.log(token);

    if (!token) throw new Error("Error Fetching Token");

    options.headers = { Authorization: `Bearer ${token}` };

    try {
      const res = await axios(options);
      this.lastResponse = res;
      return {
        data: res.data,
        next: res.next,
        previous: res.previous,
      };
    } catch (err) {
      if (retries < this.maxRetries) {
        console.log(`Error: ${err}, retrying in 2 seconds...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return await this.getResource(url, retries + 1);
      } else {
        console.error(`Failed Request statusText: `, res.statusText);
        console.log(`Failed data: `, response.data);
        throw err;
      }
    }
  };

  async getAllData(url) {
    let allData = [];
    while (url) {
      const { data, next } = await this.getResource(url);
      allData = allData.concat(data);
      url = next;
    }
    return allData;
  }

  async getCustomers() {
    const url = `${this.baseUrl}/Customer.json`;
    return this.getAllData(url);
  }

  async getInvoices() {
    return await this.getAllData(`${this.baseUrl}/Sale.json`);
  }

  async getItems() {
    return await this.getAllData(`${this.baseUrl}/Item.json`);
  }
}

export default LightspeedRetail;
