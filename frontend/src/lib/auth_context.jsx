
import { createContext, useContext, useState, useEffect } from "react";
import { api } from "./api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            if (token) {
                try {
                    // If you have a /me endpoint, use it here. 
                    // For now we might just assume valid token or store user in localstorage too.
                    // Let's assume we store user in localstorage for simplicity or fetch it.
                    // Better: fetch from /api/me
                    const res = await api.post("/me");
                    setUser(res.data);
                } catch (error) {
                    console.error("Failed to fetch user", error);
                    localStorage.removeItem("token");
                    setToken(null);
                    setUser(null);
                }
            }
            setLoading(false);
        };

        fetchUser();
    }, [token]);

    const login = async (email, password) => {
        const res = await api.post("/login", { email, password });
        const { access_token, user } = res.data.authorisation ? res.data : { access_token: res.data.access_token, user: res.data.user };
        // Adjust based on your actual API response structure from AuthController
        // The previous AuthController returns:
        /*
         {
            status: 'success',
            user: user,
            authorisation: { token: '...', type: 'bearer' }
         }
        */
        // Wait, the Sanctum-to-JWT conversion ended up with `authorisation` key in `AuthController.php`.

        // Let's check AuthController again. 
        // Yes: 'authorisation' => [ 'token' => $token, ... ]

        // BUT, wait, I might have updated it to match Sanctum key names in my previous step? 
        // No, I think I kept it as `authorisation`.
        // Let's handle both structures just in case or inspect `AuthController` again.

        // Actually, looking at `AuthController.php` content I wrote in Step 360:
        /*
            return response()->json([
                    'status' => 'success',
                    'user' => $user,
                    'authorisation' => [
                        'token' => $token,
                        'type' => 'bearer',
                    ]
                ]);
        */

        const authToken = res.data.authorisation.token;
        localStorage.setItem("token", authToken);
        setToken(authToken);
        setUser(res.data.user);
        return res.data;
    };

    const register = async (name, email, password) => {
        const res = await api.post("/register", { name, email, password });
        const authToken = res.data.authorisation.token;
        localStorage.setItem("token", authToken);
        setToken(authToken);
        setUser(res.data.user);
        return res.data;
    };

    const logout = async () => {
        try {
            await api.post("/logout");
        } catch (e) {
            console.error(e);
        }
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
