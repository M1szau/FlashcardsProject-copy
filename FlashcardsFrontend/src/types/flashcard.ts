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

export const languageOptions = 
[
    "Polish",
    "English",
    "German",
    "Spanish",
];
