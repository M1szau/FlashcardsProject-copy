import React, { useState } from "react";
import type { Flashcard } from "../../types and interfaces/types";
import type { AddFlashcardButtonProps } from "../../types and interfaces/interfaces.ts";
import { useTranslation } from "react-i18next";


export default function AddFlashcardButton({ selectedSetId, currentUser, flashcards, setFlashcards, setCurrent, setFlipped }: AddFlashcardButtonProps) 
{
    const { t } = useTranslation();
    
    //Language options with translation keys
    const languageOptions = [
        { code: 'PL', name: t('languages.PL') },
        { code: 'EN', name: t('languages.EN') },
        { code: 'DE', name: t('languages.DE') },
        { code: 'ES', name: t('languages.ES') }
    ];
    
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

            const token = localStorage.getItem('token'); 

            fetch(`/api/sets/${selectedSetId}/flashcards`, 
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
                + {t('addFlashcard.addNewFlashcard')}
            </button>

            {/* Add Flashcard Modal */}
            {adding && (
                <div className="flashcard-add-modal">
                    <form className="flashcard-add-form" onSubmit={handleSaveAdd}>
                        <h2>{t('addFlashcard.addNewFlashcard')}</h2>
                        <label>
                            {t('addFlashcard.language')}
                            <select name='language' value={addValues.language} onChange={handleAddChange} className="flashcard-edit-input" required>
                                <option value='' disabled>{t('addFlashcard.listLanguage')}</option>
                                {languageOptions.map((lang) => (<option key={lang.code} value={lang.code}>{lang.name}</option>))}
                            </select>
                        </label>
                        <div>
                            <input
                                type="text"
                                name="content"
                                value={addValues.content}
                                onChange={handleAddChange}
                                placeholder={t('addFlashcard.content')}
                                maxLength={30}
                                className="flashcard-edit-input"
                                required
                            />
                            <small style={{ color: '#666', fontSize: '0.8rem' }}>
                                {addValues.content.length}/30 {t('dashboard.characters')}
                            </small>
                        </div>
                        <label>
                            {t('addFlashcard.translationLanguage')}
                            <select name='translationLang' value={addValues.translationLang} onChange={handleAddChange} className="flashcard-edit-input" required>
                                <option value='' disabled>{t('addFlashcard.listTranslationLanguage')}</option>
                                {languageOptions.map((lang) => (<option key={lang.code} value={lang.code}>{lang.name}</option>))}
                            </select>
                        </label>
                        <div>
                            <input
                                type="text"
                                name="translation"
                                value={addValues.translation}
                                onChange={handleAddChange}
                                placeholder={t('addFlashcard.translation')}
                                maxLength={30}
                                className="flashcard-edit-input"
                                required
                            />
                            <small style={{ color: '#666', fontSize: '0.8rem' }}>
                                {addValues.translation.length}/30 {t('dashboard.characters')}
                            </small>
                        </div>
                        <div className="flashcard-actions-bottom">
                            <button className="flashcard-add-save-button" type="submit" aria-label="Save">{t('addFlashcard.save')}</button>
                            <button className="flashcard-add-cancel-button" type="button" onClick={handleCancelAdd} aria-label="Cancel">{t('addFlashcard.cancel')}</button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}
