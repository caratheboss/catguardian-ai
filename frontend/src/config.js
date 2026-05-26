const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  || (import.meta.env.PROD ? 'https://catguardian-ai.onrender.com' : 'http://localhost:8000')

export { API_BASE_URL }
