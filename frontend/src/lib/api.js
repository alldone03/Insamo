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
