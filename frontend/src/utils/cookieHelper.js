// Helper functions for cookie management
const setCookie = (name, value, days = 7) => {
  // 6 hours expiration
  const expires = new Date(Date.now() + 6 * 3600 * 1000).toUTCString();
  // Using SameSite=None with Secure for cross-origin requests
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
};

const removeCookie = (name) => {
  document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
};

export { setCookie, getCookie, removeCookie };