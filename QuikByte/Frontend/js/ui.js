// js/ui.js — shared helpers

// Makes text safe to put inside HTML (explained below)
export function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

export function showLoading(container, message = "Loading…") {
  container.innerHTML = `
    <div class="message">
      <div class="spinner"></div>
      <p>${escapeHtml(message)}</p>
    </div>`;
}

export function showEmpty(container, message) {
  container.innerHTML = `<div class="message message-empty">${escapeHtml(message)}</div>`;
}

export function showError(container, message, onRetry) {
  container.innerHTML = `
    <div class="message message-error">
      <p>${escapeHtml(message)}</p>
      ${onRetry ? '<button class="btn btn-secondary" id="retry-btn">Try again</button>' : ""}
    </div>`;
  if (onRetry) {
    container.querySelector("#retry-btn").addEventListener("click", onRetry);
  }
}