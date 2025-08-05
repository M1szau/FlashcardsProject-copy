import Navbar from "./Navbar";
import FlashcardViewer from "./FlashcardViewer";
import React, { useEffect, useState } from "react";
import { AiFillCheckCircle, AiFillCloseCircle } from "react-icons/ai";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import type { Flashcard } from "../types/flashcard";
import { useTranslation } from "react-i18next";

export default function FlashcardLearning()
{
    const { t } = useTranslation();

    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [filteredFlashcards, setFilteredFlashcards] = useState<Flashcard[]>([]);
    const [sessionFlashcards, setSessionFlashcards] = useState<Flashcard[]>([]); 
    const { setId } = useParams<{ setId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const selectedSetId = setId ?? null;
    const learnMode = searchParams.get('mode') || 'all';

    const [current, setCurrent] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [loading, setLoading] = useState(true);

    //Authentication token
    useEffect(() => 
    {
        const token = localStorage.getItem('token');
        if (!token) 
        {
            navigate('/login', { replace: true });
            return;
        }
    }, [navigate]);

    //Fetch flashcards from the API
    useEffect(() => 
    {
        if (selectedSetId) 
        {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            fetch(`/api/sets/${selectedSetId}/flashcards`, 
            {
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
                .then(data => 
                {
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

    //Learning mode - only run once when flashcards are loaded
    useEffect(() => 
    {
        if (flashcards.length > 0) 
        {
            let cardsToUse;
            if (learnMode === 'unknown') 
            {
                //Only unknown cards
                cardsToUse = flashcards.filter(card => !card.known);
            } else {
                //All cards
                cardsToUse = flashcards;
            }
            
            //Shuffled cards - random order
            const shuffledCards = shuffleArray(cardsToUse);
            
            setFilteredFlashcards(shuffledCards);
            setSessionFlashcards(shuffledCards); 
            setCurrent(0);
            setFlipped(false);
        }
    }, [flashcards.length, learnMode]);

    //Truncate flashcard text
    const truncateFlashcardText = (text: string, maxLength: number = 50) =>
    {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    //Translate language code to language name
    const getLanguageName = (langCode: string) => 
    {
        const languageMap: { [key: string]: string } = 
        {
            // Handle full language names from database
            'Polish': t('languages.PL'),
            'English': t('languages.EN'),
            'German': t('languages.DE'),
            'Spanish': t('languages.ES')
        };
        return languageMap[langCode] || langCode;
    };

    //Shuffle array randomly 
    const shuffleArray = <T,>(array: T[]): T[] => 
    {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) 
        {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    //Toggle known status of current flashcard
    const handleToggleKnown = (e: React.MouseEvent) => 
    {
        e.stopPropagation();
        if (sessionFlashcards.length === 0) return;
        
        const currentCard = sessionFlashcards[current];
        const currentKnownStatus = currentCard.known || false;
        const newKnownStatus = !currentKnownStatus;
        
        const token = localStorage.getItem('token');
        
        fetch(`/api/sets/${selectedSetId}/flashcards/${currentCard.id}/known`, 
        {
            method: 'PATCH',
            headers: 
            { 
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
            //Update the main flashcards array
            const updatedFlashcards = [...flashcards];
            const flashcardIndex = updatedFlashcards.findIndex(card => card.id === updatedCard.id);
            if (flashcardIndex !== -1)
            {
                updatedFlashcards[flashcardIndex] = updatedCard;
                setFlashcards(updatedFlashcards);
            }
            
            //Update session cards array, so the cards wwill not disappear during learning
            const updatedSessionCards = [...sessionFlashcards];
            updatedSessionCards[current] = updatedCard;
            setSessionFlashcards(updatedSessionCards);

            //Update cards to the change in UI
            const updatedFiltered = [...filteredFlashcards];
            updatedFiltered[current] = updatedCard;
            setFilteredFlashcards(updatedFiltered);
        })
        .catch(error => 
        {
            console.error('Error updating known status:', error);
            alert('Failed to update known status. Please try again.');
        });
    };

    //Card rendering
    const renderCardContent = (side: "front" | "back") => 
    {
        if (sessionFlashcards.length === 0) return null;
        
        const currentCard = sessionFlashcards[current];
        const content = side === "front" ? currentCard.content : currentCard.translation;
        const language = side === "front" ? currentCard.language : currentCard.translationLang;
        
        return (
            <>
                <div className="flashcard-known-status">
                    {currentCard.known ? 
                    (
                        <span className="known-label known">{t('flashcardLearning.alreadyKnown')}</span>
                    ) : (
                        <span className="known-label unknown">{t('flashcardLearning.notKnownYet')}</span>
                    )}
                </div>
                <div className="flashcard-language">{getLanguageName(language)}</div>
                <div className="flashcard-content" title={content}>
                    {truncateFlashcardText(content, 50)}
                </div>
            </>
        );
    };

    //Action buttons rendering
    const renderActions = () => 
    {
        if (sessionFlashcards.length === 0) return null;
        
        const currentCard = sessionFlashcards[current];
        const isKnown = currentCard.known || false;
        
        return (
            <div className="flashcard-actions-bottom">
                <button 
                    className={`flashcard-known-button ${isKnown ? 'known' : 'unknown'}`}
                    onClick={handleToggleKnown}
                    aria-label={isKnown ? "Mark as unknown" : "Mark as known"}
                >
                    {isKnown ? <AiFillCheckCircle /> : <AiFillCloseCircle />}
                </button>
            </div>
        );
    };

    if (loading) 
    {
        return (
            <>
                <Navbar />
                <div style={{ textAlign: "center", margin: "2rem", color: "#8F00BF" }}>
                    {t('flashcardLearning.loadingFlashcards')}
                </div>
            </>
        );
    }

    if (sessionFlashcards.length === 0 && !loading) 
    {
        const message = learnMode === 'unknown' 
            ? ( <>{t('flashcardLearning.noUnknownFlashcards')}<br />{t('flashcardLearning.allFlashcardsKnown')}</> )
            : ( <>{t('flashcardLearning.noFlashcardsInSet')}<br />{t('flashcardLearning.returnToDashboard')}</> );

        return (
            <>
                <Navbar />
                <div className="flashcard-center">
                    <button className="flashcard-add-save-button" onClick={() => navigate('/dashboard')} style={{ marginTop: '1rem' }}>
                        <div className="no-flashcards-message" style={{ color: '#141414'}}>{message}</div>
                    </button>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="flashcard-center">
                <FlashcardViewer 
                    current={current}
                    total={sessionFlashcards.length}
                    flipped={flipped}
                    editing={false}
                    setCurrent={setCurrent}
                    setFlipped={setFlipped}
                    setEditing={() => {}} //No editing in learning mode
                    renderCardContent={renderCardContent}
                    renderActions={renderActions}
                />
            </div>
            <div style={{ textAlign: 'center', fontSize: '1.5rem', color: '#8F00BF' }}>
                <h3>{t('flashcardLearning.learningMode')}: {learnMode === 'all' ? t('flashcardLearning.allFlashcards') : t('flashcardLearning.unknownFlashcards')}</h3>
            </div>
        </>
    );
}
