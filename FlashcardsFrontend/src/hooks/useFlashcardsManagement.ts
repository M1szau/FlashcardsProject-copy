import { useState, useEffect } from 'react';
import type { Flashcard } from '../types and interfaces/types.ts';

export function useFlashcardsManagement(selectedSetId: string | null) 
{
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [current, setCurrent] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [loading, setLoading] = useState(true);

    //Fetch flashcards from backend
    useEffect(() => 
    {
        console.log("Selected Set ID:", selectedSetId);
        if (selectedSetId) 
        {
            setLoading(true);
            console.log("Fetching flashcards for set:", selectedSetId);
            fetch(`/api/sets/${selectedSetId}/flashcards`)
                .then(res => 
                {
                    console.log("Response status:", res.status);
                    if (!res.ok) 
                    {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }
                    return res.json();
                })
                .then(data => 
                {
                    console.log("Fetched flashcards:", data);
                    setFlashcards(data || []);
                    setLoading(false);
                })
                .catch(error => 
                {
                    console.error("Fetch error:", error);
                    setFlashcards([]);
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [selectedSetId]);

    //Flashcard management actions
    const flashcardActions = 
    {
        add: (newFlashcard: Flashcard) => 
        {
            setFlashcards(prev => [...prev, newFlashcard]);
            setCurrent(flashcards.length); // Move to new card
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
        }
    };

    return {
        flashcards,
        current,
        flipped,
        loading,
        setCurrent,
        setFlipped,
        flashcardActions,
        setFlashcards //Still expose this for AddFlashcardButton compatibility
    };
}
