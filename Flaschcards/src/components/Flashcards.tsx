import Navbar from "./Navbar";
import React, { useEffect, useState } from "react";
import { AiFillEdit, AiFillDelete, AiOutlineCheck, AiOutlineClose } from "react-icons/ai";

type Flashcard = 
{
    language: string;
    content: string;
    translation: string;
    translationLang: string;
}

const initialFlashcards: Flashcard[] = 
[
    { language: "Polish", content: "Cześć", translation: "Hello", translationLang: "English" },
    { language: "Polish", content: "Witaj", translation: "Welcome", translationLang: "English" },
    { language: "Polish", content: "Dzień dobry", translation: "Good morning", translationLang: "English" },
];


export default function App()
{
    const [flashcards, setFlashcards] = useState<Flashcard[]>(initialFlashcards);
    const [current, setCurrent] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editValues, setEditValues] = useState<Flashcard | null>(null);
    const [adding, setAdding] = useState(false);
    const [addValues, setAddValues] = useState<Flashcard>(
    {
        language: "",
        content: "",
        translation: "",
        translationLang: ""
    });

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
    const handleFlip = () => setFlipped((prev) => !prev);

    //Handlers
    //Add new flashcard
    const handleAddFlashcard = () => 
    {
        setAdding(true);
        setAddValues(
        {
            language: "",
            content: "",
            translation: "",
            translationLang: ""
        });
    };
    const handleAddChange = (e: React.ChangeEvent<HTMLInputElement>) => 
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
        ) {
            setFlashcards([...flashcards, addValues]);
            setCurrent(flashcards.length); // Go to new card
            setFlipped(false);
            setAdding(false);
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
        setEditing(true);
        setEditValues({ ...flashcards[current] });
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
            const updated = [...flashcards];
            updated[current] = { ...editValues };
            setFlashcards(updated);
            setEditing(false);
            setEditValues(null);
        }
    };

    // Handle input changes
    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => 
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
            const updated = flashcards.filter((_, idx) => idx !== current);
            setFlashcards(updated);
            setCurrent((prev) => (prev > 0 ? prev - 1 : 0));
            setFlipped(false);
            setEditing(false);
        }
    };

    //Rendering card or edit form
    const renderCardContent = (side: "front" | "back") => 
    {
        if (editing) 
        {
            return (
                <form className="flashcard-edit-form" onClick={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); handleSaveEdit(e as any); }}>
                    <input
                        name={side === "front" ? "language" : "translationLang"}
                        value={side === "front" ? editValues?.language ?? "" : editValues?.translationLang ?? ""}
                        onChange={handleEditChange}
                        placeholder={side === "front" ? "Language" : "Translation Language"}
                        className="flashcard-edit-input"
                        disabled={side === "back" && !flipped}
                        required
                    />
                    <input
                        name={side === "front" ? "content" : "translation"}
                        value={side === "front" ? editValues?.content ?? "" : editValues?.translation ?? ""}
                        onChange={handleEditChange}
                        placeholder={side === "front" ? "Word" : "Translation"}
                        className="flashcard-edit-input"
                        disabled={side === "back" && !flipped}
                        required
                    />
                </form>
            );
        } else {
            if (side === "front") 
            {
                return (
                    <>
                        <div className="flashcard-language">{flashcards[current].language}</div>
                        <div className="flashcard-content">{flashcards[current].content}</div>
                    </>
                );
            } else 
            {
                return (
                    <>
                        <div className="flashcard-language">{flashcards[current].translationLang}</div>
                        <div className="flashcard-content">{flashcards[current].translation}</div>
                    </>
                );
            }
        }
    };

    //Render actions:
    const renderActions = () => 
    (
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
                    <button className="flashcard-edit-button" onClick={handleEditFlashcard} aria-label="Edit Flashcard"><AiFillEdit /></button>
                    <button className="flashcard-delete-button" onClick={handleDeleteFlashcard} aria-label="Delete Flashcard"><AiFillDelete /></button>
                </>
            )}
        </div>
    );

    return (
        <>
            <Navbar />
            <div className="flashcard-center">
                {/* Add new flashcard button */}
                <button className='flashcard-add-button' onClick={handleAddFlashcard} aria-label='Add Flashcard'>
                    + Add Flashcard
                </button>
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
            </div>
            {/* Add Flashcard Modal */}
            {adding && 
            (
                <div className="flashcard-add-modal">
                    <form className="flashcard-add-form" onSubmit={handleSaveAdd}>
                        <h2>Add New Flashcard</h2>
                        <input
                            name="language"
                            value={addValues.language}
                            onChange={handleAddChange}
                            placeholder="Language (e.g., Polish)"
                            className="flashcard-edit-input"
                            required
                        />
                        <input
                            name="content"
                            value={addValues.content}
                            onChange={handleAddChange}
                            placeholder="Word"
                            className="flashcard-edit-input"
                            required
                        />
                        <input
                            name="translationLang"
                            value={addValues.translationLang}
                            onChange={handleAddChange}
                            placeholder="Translation Language (e.g., English)"
                            className="flashcard-edit-input"
                            required
                        />
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
