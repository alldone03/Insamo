import axios from "axios";

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    },
});

// Add a request interceptor to include the token in headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle unauthenticated responses
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Check for 401 status or "Unauthenticated." message
        if (
            error.response &&
            (error.response.status === 401 || 
             (error.response.data && error.response.data.message === "Unauthenticated."))
        ) {
            // Automatically logout: clear localstorage and redirect
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            
            // Avoid infinite loop if already on login page
            if (!window.location.pathname.includes("/login")) {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);
export const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    
    // Clean path (remove leading slashes)
    const cleanPath = path.replace(/^\//, "");
    
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
    // Standardize: extract domain/base from API URL (strip /api or /api/)
    // We regex for /api with or without trailing slash
    let baseUrl = apiUrl.split(/\/api($|\/)/)[0].replace(/\/$/, "");
    
    // Force absolute if protocol is missing
    if (baseUrl && !baseUrl.startsWith('http') && !baseUrl.startsWith('/')) {
        // Use current protocol if missing
        baseUrl = `${window.location.protocol}//${baseUrl}`;
    }

    const finalUrl = `${baseUrl || ""}/storage/${cleanPath}`;
    // console.log(`DEBUG: Rendering Image URL: ${finalUrl} (Path: ${path}, ApiUrl: ${apiUrl})`);
    return finalUrl;
};
