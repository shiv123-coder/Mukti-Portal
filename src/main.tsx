import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";
import { auth } from "@/lib/firebase";

// Global Fetch Interceptor to attach Firebase token
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const [resource, config] = args;
  const url = typeof resource === 'string' ? resource : (resource instanceof Request ? resource.url : '');
  
  if (url.includes('localhost:') || url.includes('/api/')) {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        args[1] = {
          ...config,
          headers: {
            ...config?.headers,
            Authorization: `Bearer ${token}`
          }
        };
      }
    } catch (e) {
      console.warn('Failed to attach auth token:', e);
    }
  }
  return originalFetch(...args);
};

// Register Service Worker for offline support
registerSW({ immediate: true });

import { GoogleOAuthProvider } from '@react-oauth/google';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId={clientId}>
    <App />
  </GoogleOAuthProvider>
);
