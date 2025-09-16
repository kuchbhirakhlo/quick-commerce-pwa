// Helper functions for setting session cookies

/**
 * Sets a cookie with the given name, value, and expiration days
 */
export const setCookie = (name: string, value: string, days: number = 7) => {
  if (typeof document === 'undefined') return;

  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }

  // Get the current domain for proper cookie setting
  const domain = window.location.hostname;
  const isLocalhost = domain === 'localhost' || domain === '127.0.0.1';

  // In production, set cookies for the domain; in development, don't set domain
  const domainPart = !isLocalhost ? `; domain=${domain}` : '';

  // Set secure and SameSite attributes properly
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';

  document.cookie = name + "=" + encodeURIComponent(value) +
    expires +
    domainPart +
    "; path=/; SameSite=Lax" +
    secure;

  console.log(`Cookie set: ${name} for domain: ${isLocalhost ? 'localhost' : domain}`);
};

/**
 * Gets a cookie by name
 */
export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;

  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  return null;
};

/**
 * Removes a cookie by name
 */
export const removeCookie = (name: string) => {
  if (typeof document === 'undefined') return;

  // Get the current domain for proper cookie removal
  const domain = window.location.hostname;
  const isLocalhost = domain === 'localhost' || domain === '127.0.0.1';

  // In production, set domain for removal; in development, don't set domain
  const domainPart = !isLocalhost ? `; domain=${domain}` : '';

  document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/" + domainPart;
  console.log(`Cookie removed: ${name}`);
};

/**
 * Sets session cookies for vendor authentication
 */
export const setVendorSessionCookies = (uid: string, isTestMode?: boolean) => {
  if (!uid) {
    console.error("Cannot set session cookies: No UID provided");
    return;
  }

  console.log(`Setting vendor session cookies for UID: ${uid}`);

  // Set a session cookie that the middleware can check
  setCookie('session', uid, 7);

  // Set a timestamp for when the session was created
  setCookie('sessionCreated', new Date().toISOString(), 7);

  // Optionally mark session as test mode
  if (isTestMode) {
    setCookie('testMode', 'true', 7);
  }
};

/**
 * Clears all vendor session cookies
 */
export const clearVendorSessionCookies = () => {
  console.log("Clearing all vendor session cookies");
  removeCookie('session');
  removeCookie('testMode');
  removeCookie('sessionCreated');
  removeCookie('firebaseToken');
}; 