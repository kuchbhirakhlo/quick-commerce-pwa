// This file exposes environment variables to the client-side code
// It's used to make sure environment variables are available in production

// Only include NEXT_PUBLIC_ variables
const clientEnv = {};

Object.keys(process.env).forEach((key) => {
  if (key.startsWith('NEXT_PUBLIC_')) {
    clientEnv[key] = process.env[key];
  }
});

// Expose the environment variables to the window object
if (typeof window !== 'undefined') {
  window.__ENV__ = clientEnv;
}

export default clientEnv; 