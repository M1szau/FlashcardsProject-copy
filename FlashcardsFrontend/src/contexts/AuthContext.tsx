import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface User 
{
    username: string;
}

interface AuthContextType 
{
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps 
{
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) 
{
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const navigate = useNavigate();

    //Initialize auth state from localStorage on mount
    useEffect(() => 
    {
        const storedToken = localStorage.getItem('token');
        const storedUsername = localStorage.getItem('username');
        
        if (storedToken && storedUsername) 
        {
            setToken(storedToken);
            setUser({ username: storedUsername });
        }
    }, []);

    const login = (newToken: string, newUser: User) => 
    {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('token', newToken);
        localStorage.setItem('username', newUser.username);
    };

    const logout = () => 
    {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        navigate('/login');
    };

    const isAuthenticated = !!token && !!user;

    const value = 
    {
        user,
        token,
        login,
        logout,
        isAuthenticated
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() 
{
    const context = useContext(AuthContext);
    if (context === undefined) 
    {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
