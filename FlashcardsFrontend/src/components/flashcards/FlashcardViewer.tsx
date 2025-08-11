import type { FlashcardViewerProps } from '../../types and interfaces/interfaces.ts';
import { useFlashcards } from '../../contexts';

export default function FlashcardViewer(
{ 
    current, 
    total, 
    flipped, 
    isEditing,
    setCurrent: propSetCurrent,
    setFlipped: propSetFlipped,
    renderCardContent,
    renderActions
}:  FlashcardViewerProps) 
    {
        const { actions: flashcardActions } = useFlashcards();
        
        // Use passed-in functions if available, otherwise use context
        const setCurrent = propSetCurrent || flashcardActions.setCurrent;
        const setFlipped = propSetFlipped || flashcardActions.setFlipped;
        
        //Move between flashcards
        const prevCard = () => 
        { 
            if (propSetCurrent) {
                propSetCurrent((prev: number) => (prev > 0 ? prev - 1 : prev));
                propSetFlipped && propSetFlipped(false);
            } else {
                setCurrent(current > 0 ? current - 1 : current);
                setFlipped(false);
            }
        };        
        
        const nextCard = () => 
        { 
            if (propSetCurrent) {
                propSetCurrent((prev: number) => (prev < total - 1 ? prev + 1 : prev));
                propSetFlipped && propSetFlipped(false);
            } else {
                setCurrent(current < total - 1 ? current + 1 : current);
                setFlipped(false);
            }
        };

        //Flip
        const handleFlip = () => 
        {
            if (total > 0 && !isEditing) // Don't flip when editing
            {
                if (propSetFlipped) {
                    propSetFlipped((prev: boolean) => !prev);
                } else {
                    setFlipped(!flipped);
                }
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
                    disabled={current === 0 || flipped || isEditing} 
                    aria-label="Previous Flashcard"
                >
                    &#8592;
                </button>
                
                <div 
                    className="flashcard-box" 
                    onClick={handleFlip} 
                    tabIndex={0} 
                    style={{ cursor: isEditing ? "default" : "pointer" }} 
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
                    disabled={current === total - 1 || flipped || isEditing} 
                    aria-label="Next Flashcard"
                >
                    &#8594;
                </button>
            </>
        );
}
