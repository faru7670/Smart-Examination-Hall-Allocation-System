import axios from 'axios';
import { auth } from './firebase';

const API = axios.create({ baseURL: '/api' });

// Add Firebase token to all requests
API.interceptors.request.use(async (config) => {
    if (auth && auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default API;

