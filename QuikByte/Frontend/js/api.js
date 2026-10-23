
const API_BASE_URL = "http://localhost:3000/api";

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed: ${response.status}`);
  }

  return data;
}

async function getMenu() {
  const data = await apiRequest("/menu");
  return data.menu;
}

async function createOrder(order) {
  const data = await apiRequest("/orders", {
    method: "POST",
    body: JSON.stringify(order),
  });

  return data.order;
}

async function getOrder(orderId) {
  const data = await apiRequest(
    `/orders/${encodeURIComponent(orderId)}`
  );

  return data.order;
}

window.EncaveAPI = {
  getMenu,
  createOrder,
  getOrder,
};
