import React, { useState } from "react";
import type { Flashcard } from "../types/flashcard";
import { languageOptions } from "../types/flashcard";

interface AddFlashcardButtonProps 
{
    selectedSetId: string | null;
    currentUser: string;
    flashcards: Flashcard[];
    setFlashcards: React.Dispatch<React.SetStateAction<Flashcard[]>>;
    setCurrent: React.Dispatch<React.SetStateAction<number>>;
    setFlipped: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function AddFlashcardButton({ selectedSetId, currentUser, flashcards, setFlashcards, setCurrent, setFlipped }: AddFlashcardButtonProps) 
{
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
        setAddValues({
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

            const token = localStorage.getItem('token'); 

            fetch(`/api/sets/${selectedSetId}/flashcards`, 
            {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify(newCard),
            })
            .then(res => res.json())
            .then(card => 
            {
                // Handle new flashcard added -> old handleFlashcardAdded
                setFlashcards([...flashcards, card]);
                setCurrent(flashcards.length);
                setFlipped(false);
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
                + Add Flashcard
            </button>

            {/* Add Flashcard Modal */}
            {adding && (
                <div className="flashcard-add-modal">
                    <form className="flashcard-add-form" onSubmit={handleSaveAdd}>
                        <h2>Add New Flashcard</h2>
                        <label>
                            Language
                            <select name='language' value={addValues.language} onChange={handleAddChange} className="flashcard-edit-input" required>
                                <option value='' disabled>Select language</option>
                                {languageOptions.map((lang) => (<option key={lang} value={lang}>{lang}</option>))}
                            </select>
                        </label>
                        <input
                            name="content"
                            value={addValues.content}
                            onChange={handleAddChange}
                            placeholder="Word"
                            className="flashcard-edit-input"
                            required
                        />
                        <label>
                            Translation Language
                            <select name='translationLang' value={addValues.translationLang} onChange={handleAddChange} className="flashcard-edit-input" required>
                                <option value='' disabled>Select translation language</option>
                                {languageOptions.map((lang) => (<option key={lang} value={lang}>{lang}</option>))}
                            </select>
                        </label>
                        <input
                            name="translation"
                            value={addValues.translation}
                            onChange={handleAddChange}
                            placeholder="Translation"
                            className="flashcard-edit-input"
                            required
                        />
                        <div className="flashcard-actions-bottom">
                            <button className="flashcard-add-save-button" type="submit" aria-label="Save">Save</button>
                            <button className="flashcard-add-cancel-button" type="button" onClick={handleCancelAdd} aria-label="Cancel">Cancel</button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}
