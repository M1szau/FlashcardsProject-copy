import { API_BASE_URL } from "../apiBaseUrl";
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { SetType } from '../types and interfaces/types';

interface SetsContextType 
{
    sets: SetType[];
    loading: boolean;
    actions: 
    {
        add: (newSet: SetType) => void;
        update: (updatedSet: SetType, index: number) => void;
        remove: (index: number) => void;
        refresh: () => Promise<void>;
    };
}

const SetsContext = createContext<SetsContextType | undefined>(undefined);

interface SetsProviderProps 
{
    children: ReactNode;
}

export function SetsProvider({ children }: SetsProviderProps) 
{
    const [sets, setSets] = useState<SetType[]>([]);
    const [loading, setLoading] = useState(true);
    const { token, logout } = useAuth();
    const navigate = useNavigate();

    const fetchSets = async () => 
    {
        if (!token) 
        {
            navigate('/login', { replace: true });
            return;
        }

        setLoading(true);
        try 
        {
            const res = await fetch(`${API_BASE_URL}/api/sets`, 
            {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (res.status === 401 || res.status === 403) 
            {
                logout();
                return;
            }

            if (!res.ok) 
            {
                console.error('Failed to load sets');
                return;
            }

            const data = await res.json();
            setSets(data.sets || []);
        } catch (err) {
            console.error('Failed to load sets:', err);
        } finally {
            setLoading(false);
        }
    };

    //Fetch sets when token changes
    useEffect(() => 
    {
        if (token) 
        {
            fetchSets();
        } else {
            setSets([]);
            setLoading(false);
        }
    }, [token]);

    const actions = 
    {
        add: (newSet: SetType) => setSets(prev => [...prev, newSet]),
        update: (updatedSet: SetType, index: number) => setSets(prev => prev.map((s, i) => i === index ? updatedSet : s)),
        remove: (index: number) => setSets(prev => prev.filter((_, i) => i !== index)),
        refresh: fetchSets
    };

    const value = 
    {
        sets,
        loading,
        actions
    };

    return (
        <SetsContext.Provider value={value}>
            {children}
        </SetsContext.Provider>
    );
}

export function useSets() 
{
    const context = useContext(SetsContext);
    if (context === undefined) 
    {
        throw new Error('useSets must be used within a SetsProvider');
    }
    return context;
}
