// Escape HTML helper for inputs and display
function escapeHtml(text) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

// Debounce wrapper (used in sports.js but can be reused)
function debounce(func, wait = 300) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
function smoothScrollTo(elementId) {
  document.getElementById(elementId).scrollIntoView({behavior: 'smooth'});
}

function formatDateISO(date) {
  return date.toISOString().split('T')[0];
}

async function safeAsync(fn) {
  try {
    await fn();
  } catch(e) {
    console.error(e);
    logAction(`Async Error: ${e.message}`, 'ERROR');
  }
}
