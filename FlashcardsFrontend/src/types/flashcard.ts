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
