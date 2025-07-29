import Navbar from "./Navbar";
import AddFlashcardButton from "./AddFlashcardButton";
import FlashcardViewer from "./FlashcardViewer";
import React, { useEffect, useState } from "react";
import { AiFillEdit, AiFillDelete, AiOutlineCheck, AiOutlineClose, AiFillCheckCircle, AiFillCloseCircle } from "react-icons/ai";
import { useParams } from "react-router-dom";
import type { Flashcard } from "../types/flashcard";
import { languageOptions } from "../types/flashcard";

export default function App()
{
    //Consts for database
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const currentUser = localStorage.getItem('username') || 'unknown';
    const { setId } = useParams<{ setId: string }>();
    const selectedSetId = setId ?? null;

    const [current, setCurrent] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [editing, setEditing] = useState(false);

    // Helper function to truncate flashcard text
    const truncateFlashcardText = (text: string, maxLength: number = 50) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };
    const [editValues, setEditValues] = useState<Flashcard | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() =>
    {
        console.log("Selected Set ID:", selectedSetId);
        if(selectedSetId)
        {
            setLoading(true);
            console.log("Fetching flashcards for set:", selectedSetId);
            fetch(`/api/sets/${selectedSetId}/flashcards`)
                .then(res => {
                    console.log("Response status:", res.status);
                    if (!res.ok) 
                    {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }
                    return res.json();
                })
                .then(data => {
                    console.log("Fetched flashcards:", data);
                    setFlashcards(data || []);
                    setLoading(false);
                })
                .catch(error => {
                    console.error("Fetch error:", error);
                    setFlashcards([]);
                    setLoading(false);
                });
        } else 
        {
            setLoading(false);
        }
    }, [selectedSetId]);

    useEffect(() =>
    {
        //Preventing from leaving, reloading or closing the page 
        const handleBeforeUnload = (e: BeforeUnloadEvent) =>
            {
                e.preventDefault();
                e.returnValue = ''; //for Chrome
            };
            window.addEventListener('beforeunload', handleBeforeUnload);

            return () => 
            {
                window.removeEventListener('beforeunload', handleBeforeUnload);
            }
    }, []);

    //Handlers
    //Edit flashcard
    // Start editing
    const handleEditFlashcard = (e: React.MouseEvent) => 
    {
        e.stopPropagation();
        if (flashcards.length > 0) 
        {
            setEditing(true);
            setEditValues({ ...flashcards[current] });
        }
    };

    // Cancel editing
    const handleCancelEdit = (e: React.MouseEvent) => 
    {
        e.stopPropagation();
        setEditing(false);
        setEditValues(null);
    };

    // Save editing
    const handleSaveEdit = (e: React.MouseEvent) => 
    {
        e.stopPropagation();
        if (
            editValues &&
            editValues.language.trim() &&
            editValues.content.trim() &&
            editValues.translationLang.trim() &&
            editValues.translation.trim()
        ) 
        {
            const token = localStorage.getItem('token');
            
            fetch(`/api/sets/${selectedSetId}/flashcards/${editValues.id}`, 
            {
                method: 'PUT',
                headers: 
                { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify(editValues),
            })
            .then(res => 
            {
                if (!res.ok) 
                {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(card => 
            {
                const updated = [...flashcards];
                updated[current] = card;
                setFlashcards(updated);
                setEditing(false);
                setEditValues(null);
            })
            .catch(error => 
            {
                console.error('Error updating flashcard:', error);
                alert('Failed to update flashcard. Please try again.');
            });
        }
    };

    // Handle input changes
    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => 
    {
        if (!editValues) return;
        setEditValues({ ...editValues, [e.target.name]: e.target.value });
    };

    //Delete flashcard
    const handleDeleteFlashcard = (e: React.MouseEvent) => 
    {
        e.stopPropagation();
        if (flashcards.length === 1) 
        {
            alert("You must have at least one flashcard.");
            return;
        }
        if (window.confirm("Are you sure you want to delete this flashcard?")) 
        {
            const token = localStorage.getItem('token');
            
            fetch(`/api/sets/${selectedSetId}/flashcards/${flashcards[current].id}`, 
            {
                method: 'DELETE',
                headers: 
                {
                    Authorization: `Bearer ${token}`
                }
            })
            .then(res => {
                if (!res.ok) 
                {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(() => 
            {
                const updated = flashcards.filter((_, idx) => idx !== current);
                setFlashcards(updated);
                setCurrent((prev) => (prev > 0 ? prev - 1 : 0));
                setFlipped(false);
                setEditing(false);
            })
            .catch(error => 
            {
                console.error('Error deleting flashcard:', error);
                alert('Failed to delete flashcard. Please try again.');
            });
        }
    };

    //Toggle known status
    const handleToggleKnown = (e: React.MouseEvent) => 
    {
        e.stopPropagation();
        if (flashcards.length === 0) return;
        
        const currentCard = flashcards[current];
        const currentKnownStatus = currentCard.known || false; //Undefined as false
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
            const updated = [...flashcards];
            updated[current] = updatedCard;
            setFlashcards(updated);
        })
        .catch(error => 
        {
            console.error('Error updating known status:', error);
            alert('Failed to update known status. Please try again.');
        });
    };

    //Rendering card or edit form
    const renderCardContent = (side: "front" | "back") => 
    {
        if (flashcards.length === 0) return null; 
        
        if (editing) 
        {
            return (
                <form className="flashcard-edit-form" onClick={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); handleSaveEdit(e as any); }}>
                    <select
                        name={side === "front" ? "language" : "translationLang"}
                        value={side === "front" ? editValues?.language ?? "" : editValues?.translationLang ?? ""}
                        onChange={handleEditChange}
                        className="flashcard-edit-input"
                        required
                    >
                        <option value="" disabled>Select {side === "front" ? "language" : "translation language"}</option>
                        {languageOptions.map((lang) => 
                        (
                            <option key={lang} value={lang}>{lang}</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        name={side === "front" ? "content" : "translation"}
                        value={side === "front" ? editValues?.content ?? "" : editValues?.translation ?? ""}
                        onChange={handleEditChange}
                        placeholder={side === "front" ? "Word" : "Translation"}
                        maxLength={30}
                        className="flashcard-edit-input"
                        required
                    />
                </form>
            );
        } else {
            if (side === "front") 
            {
                return (
                    <>
                        <div className="flashcard-known-status">
                            {flashcards[current]?.known ? 
                            (
                                <span className="known-label known">Already known</span>
                            ) : (
                                <span className="known-label unknown">Not known yet</span>
                            )}
                        </div>
                        <div className="flashcard-main-content">
                            <div className="flashcard-language">{flashcards[current]?.language}</div>
                            <div className="flashcard-content" title={flashcards[current]?.content}>
                                {truncateFlashcardText(flashcards[current]?.content, 50)}
                            </div>
                        </div>
                    </>
                );
            } else 
            {
                return (
                    <>
                        <div className="flashcard-known-status">
                            {flashcards[current]?.known ? (
                                <span className="known-label known">Already known</span>
                            ) : (
                                <span className="known-label unknown">Not known yet</span>
                            )}
                        </div>
                        <div className="flashcard-main-content">
                            <div className="flashcard-language">{flashcards[current]?.translationLang}</div>
                            <div className="flashcard-content" title={flashcards[current]?.translation}>
                                {truncateFlashcardText(flashcards[current]?.translation, 50)}
                            </div>
                        </div>
                    </>
                );
            }
        }
    };

    //Render actions:
    const renderActions = () => 
    {
        if (flashcards.length === 0) return null;
        
        return (
            <div className="flashcard-actions-bottom">
                {editing ? 
                (
                    <>
                        <button className="flashcard-save-button" onClick={handleSaveEdit} aria-label="Save"><AiOutlineCheck /></button>
                        <button className="flashcard-cancel-button" onClick={handleCancelEdit} aria-label="Cancel"><AiOutlineClose /></button>
                    </>
                ): 
                (
                    <>
                        <button 
                            className={`flashcard-known-button ${flashcards[current]?.known ? 'known' : 'unknown'}`} 
                            onClick={handleToggleKnown} 
                            aria-label={flashcards[current]?.known ? "Mark as unknown" : "Mark as known"}
                        >
                            {flashcards[current]?.known ? <AiFillCheckCircle /> : <AiFillCloseCircle />}
                        </button>
                        <button className="flashcard-edit-button" onClick={handleEditFlashcard} aria-label="Edit Flashcard"><AiFillEdit /></button>
                        <button className="flashcard-delete-button" onClick={handleDeleteFlashcard} aria-label="Delete Flashcard"><AiFillDelete /></button>
                    </>
                )}
            </div>
        );
    };

    if (loading) 
    {
        return (
            <>
                <Navbar />
                <div style={{ textAlign: "center", margin: "2rem", color: "#8F00BF" }}>
                    Loading flashcards...
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="flashcard-center">
                {/* Add new flashcard button */}
                <AddFlashcardButton 
                    selectedSetId={selectedSetId}
                    currentUser={currentUser}
                    flashcards={flashcards}
                    setFlashcards={setFlashcards}
                    setCurrent={setCurrent}
                    setFlipped={setFlipped}
                />
                
                {flashcards.length === 0 ? (
                    <div className = 'no-flashcards-message'>
                        No flashcards in this set yet. Click "Add Flashcard" to create one!
                    </div>
                ) : (
                    <FlashcardViewer 
                        current={current}
                        total={flashcards.length}
                        flipped={flipped}
                        editing={editing}
                        setCurrent={setCurrent}
                        setFlipped={setFlipped}
                        setEditing={setEditing}
                        renderCardContent={renderCardContent}
                        renderActions={renderActions}
                    />
                )}
            </div>
        </>
    );
}