import type { SetType } from '../types and interfaces/types.ts';
import type { Flashcard } from '../types and interfaces/types.ts';

export interface DashboardImportProps 
{
    onImportSuccess: (newSet: SetType) => void;
}

export interface DashboardImportRef 
{
    handleImportClick: () => void;
}

export interface DashboardAddNewSetProps 
{
    onAddSuccess: (newSet: SetType) => void;
    onImportClick: () => void;
}

export interface DashboardAddNewSetRef 
{
    handleAddSetClick: () => void;
}

export interface DashboardImportModalProps 
{
    importFile: File | null;
    importLoading: boolean;
    onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onImportConfirm: () => void;
    onImportCancel: () => void;
}

export interface AddFlashcardModalProps 
{
    addValues: Flashcard;
    onAddChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onSaveAdd: (e: React.FormEvent) => void;
    onCancelAdd: () => void;
}

export interface AddFlashcardButtonProps 
{
    selectedSetId: string | null;
    currentUser: string;
}

export interface FlashcardViewerProps 
{
    current: number;
    total: number;
    flipped: boolean;
    isEditing: boolean;
    setCurrent?: React.Dispatch<React.SetStateAction<number>>;
    setFlipped?: React.Dispatch<React.SetStateAction<boolean>>;
    renderCardContent: (side: "front" | "back") => React.ReactNode;
    renderActions: () => React.ReactNode;
}

export interface DashboardExportProps 
{
    sets: SetType[];
}

export interface DashboardExportRef 
{
    handleExportClick: (setId: string) => void;
}

export interface DashboardEditSetBtnProps 
{
    set: SetType;
    setIndex: number;
    onEditSuccess: (updatedSet: SetType, index: number) => void;
    getLanguageName: (langCode: string) => string;
}

export interface DashboardEditSetBtnRef 
{
    handleEditSet: () => void;
    isEditing: boolean;
}

export interface DashboardDeleteSetBtnProps 
{
    set: SetType;
    setIndex: number;
    onDeleteSuccess: (index: number) => void;
}

export interface DashboardDeleteSetBtnRef 
{
    handleDeleteSet: () => void;
}

export interface DashboardSetBlockProps 
{
    set: SetType;
    setIndex: number;
    onEditSuccess: (updatedSet: SetType, index: number) => void;
    onDeleteSuccess: (index: number) => void;
    onExportClick: (setId: string) => void;
    getLanguageName: (langCode: string) => string;
    truncateText: (text: string, maxLength: number) => string;
}

export interface DashboardSetBlockRef 
{
    //No methods needed to be exposed
}

export interface FlashcardKnownStatusProps 
{
    flashcard: Flashcard;
    selectedSetId: string | null;
    onKnownStatusChange: (updatedCard: Flashcard) => void;
    showButton?: boolean; //Whether to show the toggle button or just the status label
}

export interface FlashcardKnownStatusRef 
{
    //No methods need to be exposed for now
}

export interface FlashcardDeleteBtnProps 
{
    flashcard: Flashcard;
    selectedSetId: string | null;
    onDeleteSuccess: () => void;
    flashcardsLength: number;
}

export interface FlashcardDeleteBtnRef 
{
    //No methods need to be exposed for now
}

