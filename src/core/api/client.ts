import axios from 'axios';
import { Applink } from '../../LinkApi';

const client = axios.create({
  baseURL: Applink.server,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default client;
