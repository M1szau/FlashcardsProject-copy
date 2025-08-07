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

export interface AddFlashcardButtonProps 
{
    selectedSetId: string | null;
    currentUser: string;
    flashcards: Flashcard[];
    setFlashcards: React.Dispatch<React.SetStateAction<Flashcard[]>>;
    setCurrent: React.Dispatch<React.SetStateAction<number>>;
    setFlipped: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface FlashcardViewerProps 
{
    current: number;
    total: number;
    flipped: boolean;
    editing: boolean;
    setCurrent: React.Dispatch<React.SetStateAction<number>>;
    setFlipped: React.Dispatch<React.SetStateAction<boolean>>;
    setEditing: React.Dispatch<React.SetStateAction<boolean>>;
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