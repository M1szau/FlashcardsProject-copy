import type { AddFlashcardModalProps } from "../../types and interfaces/interfaces.ts";
import { useTranslation } from "react-i18next";

export default function AddFlashcardModal({ addValues, onAddChange, onSaveAdd, onCancelAdd }: AddFlashcardModalProps) 
{
    const { t } = useTranslation();
    
    //Language options with translation keys
    const languageOptions = [
        { code: 'PL', name: t('languages.PL') },
        { code: 'EN', name: t('languages.EN') },
        { code: 'DE', name: t('languages.DE') },
        { code: 'ES', name: t('languages.ES') }
    ];

    return (
        <div className="flashcard-add-modal">
            <form className="flashcard-add-form" onSubmit={onSaveAdd}>
                <h2>{t('addFlashcard.addNewFlashcard')}</h2>
                <label>
                    {t('addFlashcard.language')}
                    <select name='language' value={addValues.language} onChange={onAddChange} className="flashcard-edit-input" required>
                        <option value='' disabled>{t('addFlashcard.listLanguage')}</option>
                        {languageOptions.map((lang) => (<option key={lang.code} value={lang.code}>{lang.name}</option>))}
                    </select>
                </label>
                <div>
                    <input
                        type="text"
                        name="content"
                        value={addValues.content}
                        onChange={onAddChange}
                        placeholder={t('addFlashcard.content')}
                        maxLength={30}
                        className="flashcard-edit-input"
                        required
                    />
                    <small style={{ color: '#666', fontSize: '0.8rem' }}>
                        {addValues.content.length}/30 {t('dashboard.characters')}
                    </small>
                </div>
                <label>
                    {t('addFlashcard.translationLanguage')}
                    <select name='translationLang' value={addValues.translationLang} onChange={onAddChange} className="flashcard-edit-input" required>
                        <option value='' disabled>{t('addFlashcard.listTranslationLanguage')}</option>
                        {languageOptions.map((lang) => (<option key={lang.code} value={lang.code}>{lang.name}</option>))}
                    </select>
                </label>
                <div>
                    <input
                        type="text"
                        name="translation"
                        value={addValues.translation}
                        onChange={onAddChange}
                        placeholder={t('addFlashcard.translation')}
                        maxLength={30}
                        className="flashcard-edit-input"
                        required
                    />
                    <small style={{ color: '#666', fontSize: '0.8rem' }}>
                        {addValues.translation.length}/30 {t('dashboard.characters')}
                    </small>
                </div>
                <div className="flashcard-actions-bottom">
                    <button className="flashcard-add-save-button" type="submit" aria-label="Save">{t('addFlashcard.save')}</button>
                    <button className="flashcard-add-cancel-button" type="button" onClick={onCancelAdd} aria-label="Cancel">{t('addFlashcard.cancel')}</button>
                </div>
            </form>
        </div>
    );
}
