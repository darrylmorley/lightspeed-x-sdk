# An Unofficial SDK for Lightspeed Retail X (formerly Vend)

## Work In Progress

Implemented GET and POST methods with pagination and rate limiting.

```
import Vend from "./index.js";

const api = new Vend("domain", access_token);

<!-- GET Example -->
const products = await api.get("/products");

<!-- POST Example -->
const brand = "MY BRAND";
api.post("/brands", { name: brand });
```
