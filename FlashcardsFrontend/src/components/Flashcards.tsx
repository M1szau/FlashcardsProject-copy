import Navbar from "./Navbar";
import React, { useEffect, useState } from "react";
import { AiFillEdit, AiFillDelete, AiOutlineCheck, AiOutlineClose, AiFillCheckCircle, AiFillCloseCircle } from "react-icons/ai";
import { useParams } from "react-router-dom";

type Flashcard = 
{
    id: string;
    setId: string;
    language: string;
    content: string;
    translation: string;
    translationLang: string;
    owner: string;
    known?: boolean;
}

const languageOptions = 
[
    "Polish",
    "English",
    "German",
    "Spanish",
];

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
    const [editValues, setEditValues] = useState<Flashcard | null>(null);
    const [adding, setAdding] = useState(false);
    const [loading, setLoading] = useState(true);
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
                    if (!res.ok) {
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
        } else {
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

    //Move between flashcards
    const prevCard = () => 
    { 
        setCurrent((prev) => (prev > 0 ? prev - 1 : prev));
        setFlipped(false); // Always show front when changing card
        setEditing(false); 
    };
    const nextCard = () => 
    { 
        setCurrent((prev) => (prev < flashcards.length - 1 ? prev + 1 : prev));
        setFlipped(false); 
        setEditing(false);
    };

    //Flip
    const handleFlip = () => {
        if (flashcards.length > 0) {
            setFlipped((prev) => !prev);
        }
    };

    //Handlers
    //Add new flashcard
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

    // Save new flashcard
    const handleSaveAdd = (e: React.FormEvent) => 
    {
        e.preventDefault();
        if (
            addValues.language.trim() &&
            addValues.content.trim() &&
            addValues.translationLang.trim() &&
            addValues.translation.trim()
        ) 
        {
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
                setFlashcards([...flashcards, card]);
                setCurrent(flashcards.length);
                setFlipped(false);
                setAdding(false);
            });
        }
    };

    // Cancel add
    const handleCancelAdd = () => 
    {
        setAdding(false);
    };

    //Edit flashcard
    // Start editing
    const handleEditFlashcard = (e: React.MouseEvent) => 
    {
        e.stopPropagation();
        if (flashcards.length > 0) {
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
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify(editValues),
            })
            .then(res => {
                if (!res.ok) {
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
            .catch(error => {
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
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(() => {
                const updated = flashcards.filter((_, idx) => idx !== current);
                setFlashcards(updated);
                setCurrent((prev) => (prev > 0 ? prev - 1 : 0));
                setFlipped(false);
                setEditing(false);
            })
            .catch(error => {
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
        const currentKnownStatus = currentCard.known || false; // Treat undefined as false
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
        .then(res => {
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
        // Check if there are no flashcards at all
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
                        {languageOptions.map((lang) => (
                            <option key={lang} value={lang}>{lang}</option>
                        ))}
                    </select>
                    <input
                        name={side === "front" ? "content" : "translation"}
                        value={side === "front" ? editValues?.content ?? "" : editValues?.translation ?? ""}
                        onChange={handleEditChange}
                        placeholder={side === "front" ? "Word" : "Translation"}
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
                            {flashcards[current]?.known ? (
                                <span className="known-label known">Already known</span>
                            ) : (
                                <span className="known-label unknown">Not known yet</span>
                            )}
                        </div>
                        <div className="flashcard-language">{flashcards[current]?.language}</div>
                        <div className="flashcard-content">{flashcards[current]?.content}</div>
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
                        <div className="flashcard-language">{flashcards[current]?.translationLang}</div>
                        <div className="flashcard-content">{flashcards[current]?.translation}</div>
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

    if (loading) {
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
                <button className='flashcard-add-button' onClick={handleAddFlashcard} aria-label='Add Flashcard'>
                    + Add Flashcard
                </button>
                
                {flashcards.length === 0 ? (
                    <div className = 'no-flashcards-message'>
                        No flashcards in this set yet. Click "Add Flashcard" to create one!
                    </div>
                ) : (
                    <>
                        {/* Flashcard counter */}
                        <div className="flashcard-counter">
                            {current + 1} / {flashcards.length}
                        </div>
                        <button className="flashcard-arrow" onClick={prevCard} disabled={current === 0 || flipped || editing} aria-label="Previous Flashcard">
                            &#8592;
                        </button>
                        <div className="flashcard-box" onClick={handleFlip} tabIndex={0} style={{ cursor: editing ? "default" : "pointer" }} aria-label="Flip flashcard">
                            <div className={`flashcard-inner${flipped ? " flipped" : ""}`}>
                                <div className="flashcard-front">
                                    {renderCardContent("front")}
                                    {renderActions()}
                                </div>
                                <div className="flashcard-back">
                                    {renderCardContent("back")}
                                    {renderActions()}
                                </div>
                            </div>
                        </div>
                        <button className="flashcard-arrow" onClick={nextCard} disabled={current === flashcards.length - 1 || flipped || editing} aria-label="Next Flashcard">
                            &#8594;
                        </button>
                    </>
                )}
            </div>
            {/* Add Flashcard Modal */}
            {adding && 
            (
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