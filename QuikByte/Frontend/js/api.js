
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

export async function getMenu() {
  return apiRequest("/menu");
}

export async function createOrder(order) {
  return apiRequest("/orders", {
    method: "POST",
    body: JSON.stringify(order),
  });
}

export async function getOrder(orderId) {
  return apiRequest(`/orders/${encodeURIComponent(orderId)}`);
}

