// js/api.js — the ONLY file that talks to the server.

const API_BASE = ""; // same address as the page, because Flask serves both

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status; // 0 = couldn't reach server at all
  }
}

// One helper that all the functions below share.
async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(API_BASE + path, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch (err) {
    // fetch() only throws when the network itself fails
    throw new ApiError("Can't reach the server. Check your connection.", 0);
  }

  let data = null;
  try {
    data = await response.json();
  } catch (err) {
    // response had no JSON body; that's okay
  }

  // fetch() does NOT throw on 404/500, so we check ourselves
  if (!response.ok) {
    const message = (data && data.error) || `Something went wrong (${response.status})`;
    throw new ApiError(message, response.status);
  }
  return data;
}

// ---- Customer ----
export const getMenu = () => request("/menu");

export const placeOrder = (items) =>
  request("/orders", {
    method: "POST",
    body: JSON.stringify({ items }), // items: [{ menu_item_id: 1, quantity: 2 }]
  });

export const getOrder = (id) => request(`/orders/${id}`);

// The QR is an image, not JSON, so we return a URL for <img src="...">
export const getQrImageUrl = (id) => `${API_BASE}/orders/${id}/qr`;

// ---- Kitchen ----
export const getKitchenOrders = () => request("/kitchen/orders");

export const updateOrderStatus = (id, status) =>
  request(`/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

// ---- Kiosk ----
export const scanToken = (token) =>
  request("/kiosk/scan", {
    method: "POST",
    body: JSON.stringify({ token }),
  });