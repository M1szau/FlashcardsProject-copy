import type { ReactNode } from "react";

export type Flashcard = 
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

export type SetType = 
{
    id: string;
    name: string;
    description: string;
    defaultLanguage: string;
    translationLanguage: string;
    owner: string;
}

export const languageOptions = 
[
    "Polish",
    "English",
    "German",
    "Spanish",
];

type SetStatistics = 
{
    setId: string;
    setName: string;
    totalCards: number;
    knownCards: number;
    unknownCards: number;
};

export type Statistics = 
{
    totalSets: number;
    totalFlashcards: number;
    totalKnownCards: number;
    totalUnknownCards: number;
    setStatistics: SetStatistics[];
};

export type HeaderProps = 
{
    image: 
    {
        src: string;
        alt: string;
    };
    children: ReactNode;
};