import axios from 'axios';
import { auth } from './firebase';

// In production (Vercel), use the Render backend URL via env variable
// In local dev, use Vite proxy (relative /api path)
const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

// Add Firebase token to all requests
API.interceptors.request.use(async (config) => {
    if (auth && auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default API;

