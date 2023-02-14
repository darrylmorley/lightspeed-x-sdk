import axios from "axios";

class Vend {
  constructor(domain, accessToken) {
    this.domain = domain;
    this.accessToken = accessToken;
    this.baseUrl = `https://${domain}.vendhq.com/api/2.0`;
    this.rateLimitRemaining = null;
    this.rateLimitReset = null;
    this.rateLimitInterval = null;
  }

  // async get(endpoint, params = {}) {
  //   const url = this.buildUrl(endpoint, params);
  //   const response = await this.fetchWithRateLimit(url, "GET");
  //   const data = response.data;
  //   const result = {
  //     data: data.data,
  //     version: response.headers["x-pagination-version"],
  //   };
  //   return result;
  // }

  async get(endpoint, params = {}) {
    let result = { data: [] };
    let version = null;
    let responseData;

    do {
      // Set the `after` parameter for pagination, if available
      if (version !== null) {
        params.after = version;
      }

      // Build the request URL with the endpoint and query parameters
      const url = this.buildUrl(endpoint, params);

      // Make the request with the rate limiting logic
      const response = await this.fetchWithRateLimit(url, "GET");

      // Extract the data and `version` attribute from the response
      responseData = response.data.data;
      version = response.data.version.max;

      // Add the current page of data to the results
      result.data = result.data.concat(responseData);
    } while (responseData.length > 0); // Continue looping until an empty collection is returned

    return result;
  }

  async post(endpoint, data) {
    const url = this.buildUrl(endpoint);
    const response = await this.fetchWithRateLimit(url, "POST", data);
    return response.data;
  }

  async fetchWithRateLimit(url, method, data) {
    // Wait until the rate limit interval is over, if necessary
    await this.waitUntilRateLimitReset();
    // Make the request and update the rate limit information
    const response = await axios({
      method,
      url,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      data: data,
    });
    this.updateRateLimit(response);
    return response;
  }

  buildUrl(endpoint, params = {}) {
    let url = `${this.baseUrl}${endpoint}`;
    const searchParams = new URLSearchParams(params);
    if (searchParams.toString()) {
      url += `?${searchParams.toString()}`;
    }
    return url;
  }

  async waitUntilRateLimitReset() {
    if (this.rateLimitRemaining === null || this.rateLimitRemaining > 0) {
      // The rate limit has not been exceeded, so no need to wait
      return;
    }
    // Wait for the rate limit interval to expire
    const now = Math.floor(Date.now() / 1000);
    const delay = this.rateLimitReset - now;
    await new Promise((resolve) => setTimeout(resolve, delay * 1000));
  }

  updateRateLimit(response) {
    const remaining = response.headers["x-rate-limit-remaining"];
    if (remaining !== null) {
      this.rateLimitRemaining = parseInt(remaining);
    }
    const reset = response.headers["x-rate-limit-reset"];
    if (reset !== null) {
      this.rateLimitReset = parseInt(reset);
      this.rateLimitInterval = this.rateLimitReset - Math.floor(Date.now() / 1000);
    }
  }
}

export default Vend;
