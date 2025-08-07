import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SetType } from '../types and interfaces/types.ts';

export function useSetsManagement() {
    const [sets, setSets] = useState<SetType[]>([]);
    const navigate = useNavigate();

    //Fetch sets from backend on mount
    useEffect(() => 
    {
        const token = localStorage.getItem('token');
        if (!token) 
        {
            navigate('/login', { replace: true });
            return;
        }

        async function fetchSets() 
        {
            try 
            {
                const res = await fetch('/api/sets', 
                {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (res.status === 401 || res.status === 403) 
                {
                    localStorage.removeItem('token');
                    navigate('/login', { replace: true });
                    return;
                }

                if (!res.ok) 
                {
                    alert('Failed to load sets.');
                    return;
                }

                const data = await res.json();
                setSets(data.sets || []);
            } catch (err) {
                alert('Failed to load sets.');
            }
        }
        
        fetchSets();
    }, [navigate]);

    //Sets state management actions
    const setsActions = 
    {
        add: (newSet: SetType) => setSets(prev => [...prev, newSet]),
        update: (updatedSet: SetType, index: number) => setSets(prev => prev.map((s, i) => i === index ? updatedSet : s)),
        remove: (index: number) => setSets(prev => prev.filter((_, i) => i !== index))
    };

    return {
        sets,
        setsActions
    };
}
