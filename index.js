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

class LightspeedRetailSDK {
  constructor(opts) {
    const { clientID, clientSecret, refreshToken, accountID } = opts;

    this.clientID = clientID;
    this.clientSecret = clientSecret;
    this.refreshToken = refreshToken;
    this.accountID = accountID;
    this.baseUrl = "https://api.lightspeedapp.com/API/V3/Account";
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
    const body = {
      grant_type: "refresh_token",
      client_id: this.clientID,
      client_secret: this.clientSecret,
      refresh_token: this.refreshToken,
    };

    const response = await axios({
      url: "https://cloud.lightspeedapp.com/oauth/access_token.php",
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      data: JSON.stringify(body),
    }).catch((error) => console.error(error.response.data));

    const tokenData = await response.data;
    const token = tokenData.access_token;

    return token;
  };

  getResource = async (options, retries = 0) => {
    this.handleRateLimit(options);

    const token = await this.getToken();

    if (!token) throw new Error("Error Fetching Token");

    options.headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

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

  async getAllData(options) {
    let allData = [];
    while (options.url) {
      const { data } = await this.getResource(options);
      let next = data["@attributes"].next;
      let selectDataArray = Object.keys(data)[1];
      let selectedData = data[selectDataArray];
      allData = allData.concat(selectedData);
      options.url = next;
    }
    // console.log(allData);
    return allData;
  }

  async getCustomers() {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Customer.json`,
      method: "GET",
    };

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET CUSTOMERS ERROR", error.response);
    }
  }

  async getItems() {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Item.json`,
      method: "GET",
    };

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET ITEMS ERROR", error.response);
    }
  }

  async getItem(itemID) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Item/${itemID}.json`,
      method: "GET",
    };

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET ITEM ERROR", error.response);
    }
  }

  async getCategories() {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Category.json`,
      method: "GET",
    };

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET CATEGORIES ERROR", error.response);
    }
  }

  async getCategory(categoryID) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Category/${categoryID}.json`,
      method: "GET",
    };

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET ITEM ERROR", error.response);
    }
  }

  async getManufacturers() {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Category.json`,
      method: "GET",
    };

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET CATEGORIES ERROR", error.response);
    }
  }

  async getManufacturer(manufacturerID) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Manufacturer/${manufacturerID}.json`,
      method: "GET",
    };

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET CATEGORIES ERROR", error.response);
    }
  }

  async getOrders() {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Order.json`,
      method: "GET",
    };

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET CATEGORIES ERROR", error.response);
    }
  }

  async getOrder(orderID) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Order/${orderID}.json`,
      method: "GET",
    };

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET CATEGORIES ERROR", error.response);
    }
  }

  async getVendors() {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Vendor.json`,
      method: "GET",
    };

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET CATEGORIES ERROR", error.response);
    }
  }

  async getVendor(vendorID) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Vendor/${vendorID}.json`,
      method: "GET",
    };

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET CATEGORIES ERROR", error.response);
    }
  }

  async getSales() {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Sale.json`,
      method: "GET",
    };

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET CATEGORIES ERROR", error.response);
    }
  }

  async getSale(saleID) {
    const options = {
      url: `${this.baseUrl}/${this.accountID}/Sale/${saleID}.json`,
      method: "GET",
    };

    try {
      const response = await this.getAllData(options);
      return response;
    } catch (error) {
      return this.handleError("GET CATEGORIES ERROR", error.response);
    }
  }
}

export default LightspeedRetailSDK;
