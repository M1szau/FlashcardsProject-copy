import { API_BASE_URL } from "../../apiBaseUrl";
import Navbar from "../Navbar";
import AddFlashcardButton from "./AddFlashcardButton";
import FlashcardViewer from "./FlashcardViewer";
import FlashcardDeleteBtn from "./FlashcardDeleteBtn";
import FlashcardKnownStatus from "./FlashcardKnownStatus";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useFlashcards, useAuth } from "../../contexts";
import { AiOutlineCheck, AiOutlineClose, AiFillEdit } from "react-icons/ai";

export default function App()
{
    const { t } = useTranslation();
    const { setId } = useParams<{ setId: string }>();
    const { user, token } = useAuth();
    const {
        flashcards,
        current,
        flipped,
        loading,
        actions: flashcardActions
    } = useFlashcards();

    //Set the current set when component mounts
    useEffect(() => 
    {
        if (setId) {
            flashcardActions.setCurrentSet(setId);
        }
    }, [setId]);

    const currentUser = user?.username || 'unknown';
    
    //Editing state and ref
    const [isEditing, setIsEditing] = useState(false);
    const [editValues, setEditValues] = useState<any>(null);

    //Language options with translation keys
    const languageOptions = [
        { code: 'PL', name: t('languages.PL') },
        { code: 'EN', name: t('languages.EN') },
        { code: 'DE', name: t('languages.DE') },
        { code: 'ES', name: t('languages.ES') }
    ];

    //Function to truncate flashcard text
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
            //Handle full language names from database
            'Polish': t('languages.PL'),
            'English': t('languages.EN'),
            'German': t('languages.DE'),
            'Spanish': t('languages.ES')
        };
        return languageMap[langCode] || langCode;
    };

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

    //Edit button
    const handleEditFlashcard = (e: React.MouseEvent) => 
    {
        e.stopPropagation();
        if (flashcards.length > 0) 
        {
            setIsEditing(true);
            setEditValues({ ...flashcards[current] });
        }
    };

    const handleEditSave = () => 
    {
        if (
            editValues &&
            editValues.language.trim() &&
            editValues.content.trim() &&
            editValues.translationLang.trim() &&
            editValues.translation.trim()
        ) {
            fetch(`${API_BASE_URL}/api/sets/${setId}/flashcards/${editValues.id}`, 
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
                flashcardActions.update(card);
                setEditValues(null);
                setIsEditing(false);
            })
            .catch(error => 
            {
                console.error('Error updating flashcard:', error);
                alert('Failed to update flashcard. Please try again.');
            });
        }
    };

    const handleEditCancel = () => {
        setEditValues(null);
        setIsEditing(false);
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (!editValues) return;
        setEditValues({ ...editValues, [e.target.name]: e.target.value });
    };

    //Rendering card content (shows edit form when editing, otherwise shows card content)
    const renderCardContent = (side: "front" | "back") => 
    {
        if (flashcards.length === 0) return null; 
        
        if (isEditing && editValues) 
        {            
            return (
                <form 
                    className="flashcard-edit-form" 
                    onClick={e => e.stopPropagation()} 
                    onSubmit={e => { e.preventDefault(); handleEditSave(); }}
                >
                    <select
                        name={side === "front" ? "language" : "translationLang"}
                        value={side === "front" ? editValues.language ?? "" : editValues.translationLang ?? ""}
                        onChange={handleEditChange}
                        className="flashcard-edit-input"
                        required
                    >
                        <option value="" disabled>{t('flashcards.select')} {side === "front" ? t('flashcards.language') : t('flashcards.translationLanguage')}</option>
                        {languageOptions.map((lang) => (
                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        name={side === "front" ? "content" : "translation"}
                        value={side === "front" ? editValues.content ?? "" : editValues.translation ?? ""}
                        onChange={handleEditChange}
                        placeholder={side === "front" ? t('flashcards.content') : t('flashcards.translation')}
                        maxLength={30}
                        className="flashcard-edit-input"
                        required
                    />
                </form>
            );
        }
        
        if (side === "front") 
        {
            return (
                <>
                    <FlashcardKnownStatus 
                        flashcard={flashcards[current]}
                        selectedSetId={setId ?? null}
                        onKnownStatusChange={(updatedCard) => flashcardActions.update(updatedCard)}
                        showButton={false} //Just show the status label
                    />
                    <div className="flashcard-main-content">
                        <div className="flashcard-language">{getLanguageName(flashcards[current]?.language)}</div>
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
                    <FlashcardKnownStatus 
                        flashcard={flashcards[current]}
                        selectedSetId={setId ?? null}
                        onKnownStatusChange={(updatedCard) => flashcardActions.update(updatedCard)}
                        showButton={false} 
                    />
                    <div className="flashcard-main-content">
                        <div className="flashcard-language">{getLanguageName(flashcards[current]?.translationLang)}</div>
                        <div className="flashcard-content" title={flashcards[current]?.translation}>
                            {truncateFlashcardText(flashcards[current]?.translation, 50)}
                        </div>
                    </div>
                </>
            );
        }
    };

    //Render actions:
    const renderActions = () => 
    {
        if (flashcards.length === 0) return null;
        
        if (isEditing) {
            return (
                <div className="flashcard-actions-bottom">
                    <button className="flashcard-save-button" onClick={handleEditSave} aria-label="Save">
                        <AiOutlineCheck />
                    </button>
                    <button 
                        className="flashcard-cancel-button" 
                        onClick={handleEditCancel} 
                        aria-label="Cancel"
                        onMouseEnter={(e) => e.currentTarget.blur()}
                    >
                        <AiOutlineClose />
                    </button>
                </div>
            );
        }
        
        return (
            <div className="flashcard-actions-bottom">
                <FlashcardKnownStatus 
                    flashcard={flashcards[current]}
                    selectedSetId={setId ?? null}
                    onKnownStatusChange={(updatedCard) => flashcardActions.update(updatedCard)}
                    showButton={true} //Show as clickable button
                />
                <button className="flashcard-edit-button" onClick={handleEditFlashcard} aria-label="Edit Flashcard"><AiFillEdit /></button>
                <FlashcardDeleteBtn 
                    flashcard={flashcards[current]}
                    selectedSetId={setId ?? null}
                    onDeleteSuccess={() => 
                    {
                        flashcardActions.remove();
                    }}
                    flashcardsLength={flashcards.length}
                />
            </div>
        );
    };

    if (loading) 
    {
        return (
            <>
                <Navbar />
                <div style={{ textAlign: "center", margin: "2rem", color: "#8F00BF" }}>
                    {t('flashcards.loading')}
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
                    selectedSetId={setId ?? null}
                    currentUser={currentUser}
                />
                
                {flashcards.length === 0 ? (
                    <div className = 'no-flashcards-message'>
                        {t('flashcards.noFlashcards')}
                    </div>
                ) : (
                    <FlashcardViewer 
                        current={current}
                        total={flashcards.length}
                        flipped={flipped}
                        isEditing={isEditing}
                        renderCardContent={renderCardContent}
                        renderActions={renderActions}
                    />
                )}
            </div>
        </>
    );
}