import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type { Flashcard } from '../types and interfaces/types';

interface FlashcardsContextType 
{
    flashcards: Flashcard[];
    current: number;
    flipped: boolean;
    loading: boolean;
    selectedSetId: string | null;
    actions: {
        add: (newFlashcard: Flashcard) => void;
        update: (updatedCard: Flashcard) => void;
        remove: () => void;
        updateByIndex: (updatedCard: Flashcard, index: number) => void;
        setCurrentSet: (setId: string | null) => void;
        setCurrent: (index: number) => void;
        setFlipped: (flipped: boolean) => void;
        refresh: () => Promise<void>;
    };
}

const FlashcardsContext = createContext<FlashcardsContextType | undefined>(undefined);

interface FlashcardsProviderProps 
{
    children: ReactNode;
}

export function FlashcardsProvider({ children }: FlashcardsProviderProps) 
{
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [current, setCurrent] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
    const { token } = useAuth();

    const fetchFlashcards = async (setId: string | null) => 
    {
        if (!setId || !token) 
        {
            setFlashcards([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try 
        {
            const res = await fetch(`/api/sets/${setId}/flashcards`, 
            {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) 
            {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();
            setFlashcards(data || []);
        } catch (error) {
            console.error('Fetch error:', error);
            setFlashcards([]);
        } finally {
            setLoading(false);
        }
    };

    //Fetch flashcards when selectedSetId changes
    useEffect(() => 
    {
        fetchFlashcards(selectedSetId);
    }, [selectedSetId, token]);

    const actions = 
    {
        add: (newFlashcard: Flashcard) => 
        {
            setFlashcards(prev => [...prev, newFlashcard]);
            setCurrent(flashcards.length);
            setFlipped(false);
        },
        update: (updatedCard: Flashcard) => 
        {
            setFlashcards(prev => prev.map(card => card.id === updatedCard.id ? updatedCard : card));
        },
        remove: () => 
        {
            setFlashcards(prev => prev.filter((_, idx) => idx !== current));
            setCurrent((prev) => (prev > 0 ? prev - 1 : 0));
            setFlipped(false);
        },
        updateByIndex: (updatedCard: Flashcard, index: number) => 
        {
            setFlashcards(prev => prev.map((card, i) => i === index ? updatedCard : card));
        },
        setCurrentSet: (setId: string | null) => 
        {
            setSelectedSetId(setId);
            setCurrent(0);
            setFlipped(false);
        },
        setCurrent,
        setFlipped,
        refresh: () => fetchFlashcards(selectedSetId)
    };

    const value = 
    {
        flashcards,
        current,
        flipped,
        loading,
        selectedSetId,
        actions
    };

    return (
        <FlashcardsContext.Provider value={value}>
            {children}
        </FlashcardsContext.Provider>
    );
}

export function useFlashcards() 
{
    const context = useContext(FlashcardsContext);
    if (context === undefined) 
    {
        throw new Error('useFlashcards must be used within a FlashcardsProvider');
    }
    return context;
}
