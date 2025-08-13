import { API_BASE_URL } from "../../apiBaseUrl";
import React, { forwardRef, useImperativeHandle } from 'react';
import { AiFillCheckCircle, AiFillCloseCircle } from "react-icons/ai";
import { useTranslation } from "react-i18next";
import { useAuth } from '../../contexts';
import type { FlashcardKnownStatusProps, FlashcardKnownStatusRef } from '../../types and interfaces/interfaces.ts';


const FlashcardKnownStatus = forwardRef<FlashcardKnownStatusRef, FlashcardKnownStatusProps>((props, ref) => 
{
    const { flashcard, selectedSetId, onKnownStatusChange, showButton = false } = props;
    const { t } = useTranslation();
    const { token } = useAuth();

    const handleToggleKnown = (e: React.MouseEvent) => 
    {
        e.stopPropagation();
        
        const currentKnownStatus = flashcard.known || false; // Undefined as false
        const newKnownStatus = !currentKnownStatus;
        
    fetch(`${API_BASE_URL}/api/sets/${selectedSetId}/flashcards/${flashcard.id}/known`, 
        {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({ known: newKnownStatus }),
        })
        .then(res => 
        {
            if (!res.ok) 
            {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(updatedCard => 
        {
            onKnownStatusChange(updatedCard);
        })
        .catch(error => 
        {
            console.error('Error updating known status:', error);
            alert('Failed to update known status. Please try again.');
        });
    };

    useImperativeHandle(ref, () => ({}));

    //If showButton is true, render the toggle button
    if (showButton) 
    {
        return (
            <button 
                className={`flashcard-known-button ${flashcard.known ? 'known' : 'unknown'}`} 
                onClick={handleToggleKnown} 
                aria-label={flashcard.known ? "Mark as unknown" : "Mark as known"}
            >
                {flashcard.known ? <AiFillCheckCircle /> : <AiFillCloseCircle />}
            </button>
        );
    }

    //Otherwise, just render the status label
    return (
        <div className="flashcard-known-status">
            {flashcard.known ? (
                <span className="known-label known">{t('flashcards.alreadyKnown')}</span>
            ) : (
                <span className="known-label unknown">{t('flashcards.notKnownYet')}</span>
            )}
        </div>
    );
});

FlashcardKnownStatus.displayName = 'FlashcardKnownStatus';

export default FlashcardKnownStatus;