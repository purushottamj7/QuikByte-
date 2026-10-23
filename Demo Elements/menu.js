import { getMenu } from "./api.js";
import { showLoading, showEmpty, showError, escapeHtml } from "./ui.js";

const menuEl = document.getElementById("menu");

async function loadMenu() {
  showLoading(menuEl, "Loading menu…");
  try {
    const items = await getMenu();
    if (items.length === 0) {
      showEmpty(menuEl, "The menu is empty right now. Please check back soon.");
      return;
    }
    menuEl.innerHTML = `<div class="grid">` + items.map((item) => `
      <div class="card">
        <h3>${escapeHtml(item.name)}</h3>
        <p>₹${item.price}</p>
      </div>`).join("") + `</div>`;
  } catch (err) {
    showError(menuEl, err.message, loadMenu); // "Try again" re-runs loadMenu
  }
}

loadMenu();