import { listProducts } from '../services/products.service.js';
import { sendJson } from '../http/router.js';
export function getProducts(_req, res) {
    sendJson(res, 200, { products: listProducts() });
}
