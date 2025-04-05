import axios from 'axios';

// Create an axios instance with a base URL for our API
const apiClient = axios.create({
  // In production, use relative URL (no base path) so that version (v1/v2) can be included in each request
  baseURL: process.env.NODE_ENV === 'production' 
    ? '' // Empty string allows for relative paths with version numbers
    : 'http://localhost:3000', // In development, keep the domain but remove version prefix
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // This enables sending cookies with requests
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Get token from cookie or localStorage if needed
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];

    // If token exists, add it to the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle case of 400 validation errors
    if (error.response && error.response.data.validationResult) {
      return error.response;
    }

    // Handle authentication errors (401)
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access
      console.error('Authentication error:', error.response.data.message);
      
      // Clear invalid tokens
      document.cookie = 'token=; Max-Age=0; path=/; SameSite=Lax';
      localStorage.removeItem('user');
      
      // Redirect to login if needed
      // window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default apiClient; 