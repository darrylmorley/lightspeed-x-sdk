# Another Unofficial Lightspeed Retail V3 API SDK for Node.

## Work In Progress

First, import LightSpeed Retail SDK:- import LightspeedRetailSDK from "./index.js";

Then intialise a new instance of LightspeedRetailSDK:-

```
const api = new LightspeedRetailSDK({
  accountID: "Your Account No.",
  clientID: "Your client ID.",
  clientSecret: "Your client secret.",
  refreshToken: "Your refresh token.",
});

const item = await api.getItem(7947, '["Category", "Images"]');
console.log(item);
```
