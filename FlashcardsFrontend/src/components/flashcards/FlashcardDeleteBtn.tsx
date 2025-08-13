import { API_BASE_URL } from "../../apiBaseUrl";
import React, { forwardRef, useImperativeHandle } from 'react';
import { AiFillDelete } from "react-icons/ai";
import { useAuth } from '../../contexts';
import type { FlashcardDeleteBtnProps, FlashcardDeleteBtnRef } from '../../types and interfaces/interfaces.ts';



const FlashcardDeleteBtn = forwardRef<FlashcardDeleteBtnRef, FlashcardDeleteBtnProps>((props, ref) => 
{
    const { flashcard, selectedSetId, onDeleteSuccess, flashcardsLength } = props;
    const { token } = useAuth();

    const handleDeleteFlashcard = (e: React.MouseEvent) => 
    {
        e.stopPropagation();
        
        if (flashcardsLength === 1) 
        {
            alert("You must have at least one flashcard.");
            return;
        }
        
        if (window.confirm("Are you sure you want to delete this flashcard?")) 
        {
            fetch(`${API_BASE_URL}/api/sets/${selectedSetId}/flashcards/${flashcard.id}`, 
            {
                method: 'DELETE',
                headers: 
                {
                    Authorization: `Bearer ${token}`
                }
            })
            .then(res => 
            {
                if (!res.ok) 
                {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(() => 
            {
                onDeleteSuccess();
            })
            .catch(error => 
            {
                console.error('Error deleting flashcard:', error);
                alert('Failed to delete flashcard. Please try again.');
            });
        }
    };

    useImperativeHandle(ref, () => ({}));

    return (
        <button className="flashcard-delete-button" onClick={handleDeleteFlashcard} aria-label="Delete Flashcard">
            <AiFillDelete />
        </button>
    );
});

FlashcardDeleteBtn.displayName = 'FlashcardDeleteBtn';

export default FlashcardDeleteBtn;
