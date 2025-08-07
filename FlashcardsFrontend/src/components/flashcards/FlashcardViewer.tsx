import type { FlashcardViewerProps } from '../../types and interfaces/interfaces.ts';

export default function FlashcardViewer(
{ 
    current, 
    total, 
    flipped, 
    editing,
    setCurrent,
    setFlipped,
    setEditing,
    renderCardContent,
    renderActions
}:  FlashcardViewerProps) 
    {
        //Move between flashcards
        const prevCard = () => 
        { 
            setCurrent((prev) => (prev > 0 ? prev - 1 : prev));
            setFlipped(false); //Must be front when changing card
            setEditing(false); 
        };
        
        const nextCard = () => 
        { 
            setCurrent((prev) => (prev < total - 1 ? prev + 1 : prev));
            setFlipped(false); 
            setEditing(false);
        };

        //Flip
        const handleFlip = () => 
        {
            if (total > 0) 
            {
                setFlipped((prev) => !prev);
            }
        };

        return (
            <>
                {/* Flashcard counter */}
                <div className="flashcard-counter">
                    {current + 1} / {total}
                </div>
                
                <button 
                    className="flashcard-arrow" 
                    onClick={prevCard} 
                    disabled={current === 0 || flipped || editing} 
                    aria-label="Previous Flashcard"
                >
                    &#8592;
                </button>
                
                <div 
                    className="flashcard-box" 
                    onClick={handleFlip} 
                    tabIndex={0} 
                    style={{ cursor: editing ? "default" : "pointer" }} 
                    aria-label="Flip flashcard"
                >
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
                
                <button 
                    className="flashcard-arrow" 
                    onClick={nextCard} 
                    disabled={current === total - 1 || flipped || editing} 
                    aria-label="Next Flashcard"
                >
                    &#8594;
                </button>
            </>
        );
}
