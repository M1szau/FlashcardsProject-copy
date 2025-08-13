import { API_BASE_URL } from "../../apiBaseUrl";
import React, { useState } from "react";
import type { Flashcard } from "../../types and interfaces/types";
import type { AddFlashcardButtonProps } from "../../types and interfaces/interfaces.ts";
import AddFlashcardModal from "./AddFlashcardModal";
import { useTranslation } from "react-i18next";
import { useFlashcards, useAuth } from "../../contexts";


export default function AddFlashcardButton({ selectedSetId, currentUser }: AddFlashcardButtonProps) 
{
    const { t } = useTranslation();
    const { actions: flashcardActions } = useFlashcards();
    const { token } = useAuth();
    
    const [adding, setAdding] = useState(false);
    const [addValues, setAddValues] = useState<Flashcard>(
    {
        id: "",
        setId: "",
        language: "",
        content: "",
        translation: "",
        translationLang: "",
        owner: currentUser,
        known: false
    });

    const handleAddFlashcard = () => 
    {
        setAdding(true);
        setAddValues(
        {
            id: "",
            setId: selectedSetId || "",
            language: "",
            content: "",
            translation: "",
            translationLang: "",
            owner: currentUser,
            known: false
        });
    };

    const handleAddChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => 
    {
        setAddValues({ ...addValues, [e.target.name]: e.target.value });
    };

    const handleSaveAdd = (e: React.FormEvent) => 
    {
        e.preventDefault();
        if (
            addValues.language.trim() &&
            addValues.content.trim() &&
            addValues.translationLang.trim() &&
            addValues.translation.trim()
        ) {
            const newCard = 
            {
                ...addValues, 
                setId: selectedSetId,
                id: Date.now().toString(),
                owner: currentUser
            };

            fetch(`${API_BASE_URL}/api/sets/${selectedSetId}/flashcards`, 
            {
                method: 'POST',
                headers: 
                { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify(newCard),
            })
            .then(res => res.json())
            .then(card => 
            {
                // Handle new flashcard added using context
                flashcardActions.add(card);
                setAdding(false);
            })
            .catch(error => 
            {
                console.error('Error adding flashcard:', error);
                alert('Failed to add flashcard. Please try again.');
            });
        }
    };

    const handleCancelAdd = () => 
    {
        setAdding(false);
    };

    return (
        <>
            <button 
                className='flashcard-add-button' 
                onClick={handleAddFlashcard} 
                aria-label='Add Flashcard'
            >
                + {t('addFlashcard.addNewFlashcard')}
            </button>

            {/* Add Flashcard Modal */}
            {adding && (
                <AddFlashcardModal
                    addValues={addValues}
                    onAddChange={handleAddChange}
                    onSaveAdd={handleSaveAdd}
                    onCancelAdd={handleCancelAdd}
                />
            )}
        </>
    );
}
