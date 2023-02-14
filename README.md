# An Unofficial SDK for Lightspeed Retail X (formerly Vend)

## Work In Progress

Implemented GET and POST methods with pagination and rate limiting.

```
import Vend from "./index.js";

const api = new Vend("domain", access_token);

const products = await api.get("/products");
```
