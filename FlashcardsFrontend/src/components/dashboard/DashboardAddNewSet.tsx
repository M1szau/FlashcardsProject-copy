import { useState, forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from "react-i18next";
import { AiOutlineDownload } from "react-icons/ai";
import { useAuth } from '../../contexts';
import type { DashboardAddNewSetProps } from '../../types and interfaces/interfaces.ts';
import type { DashboardAddNewSetRef } from '../../types and interfaces/interfaces.ts';


const DashboardAddNewSet = forwardRef<DashboardAddNewSetRef, DashboardAddNewSetProps>(({ 
    onAddSuccess, 
    onImportClick 
}, ref) => 
    {
    const { t } = useTranslation();
    const { token } = useAuth();
    
    //Language options with translation keys
    const languageOptions = [
        { code: 'PL', name: t('languages.PL') },
        { code: 'EN', name: t('languages.EN') },
        { code: 'DE', name: t('languages.DE') },
        { code: 'ES', name: t('languages.ES') }
    ];

    const [adding, setAdding] = useState(false);
    const [newSetName, setNewSetName] = useState('');
    const [newSetDescription, setNewSetDescription] = useState('');
    const [newSetDefaultLanguage, setNewSetDefaultLanguage] = useState('PL');
    const [newSetTranslationLanguage, setNewSetTranslationLanguage] = useState('EN');
    const [addingLoading, setAddingLoading] = useState(false);

    function handleAddSetClick() 
    {
        setAdding(true);
        setNewSetName('');
        setNewSetDescription('');
        setNewSetDefaultLanguage('PL');
        setNewSetTranslationLanguage('EN');
    }

    async function handleAddSetConfirm() 
    {
        if (newSetName.trim() === '' || addingLoading) return;
        setAddingLoading(true);
        try 
        {
            const res = await fetch('/api/sets', 
                {
                method: 'POST',
                headers: 
                {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(
                {
                    name: newSetName.trim(),
                    description: newSetDescription.trim(),
                    defaultLanguage: newSetDefaultLanguage,
                    translationLanguage: newSetTranslationLanguage
                })
            });
            if (!res.ok) throw new Error('Failed to add set');
            const data = await res.json();
            
            // Reset form and notify parent
            setAdding(false);
            setNewSetName('');
            setNewSetDescription('');
            setNewSetDefaultLanguage('PL');
            setNewSetTranslationLanguage('EN');
            onAddSuccess(data.set);
        } catch (err) {
            alert('Failed to add set.');
        } finally {
            setAddingLoading(false);
        }
    }

    function handleAddSetCancel() 
    {
        setAdding(false);
        setNewSetName('');
        setNewSetDescription('');
        setNewSetDefaultLanguage('PL');
        setNewSetTranslationLanguage('EN');
        setAddingLoading(false);
    }

    useImperativeHandle(ref, () => (
    {
        handleAddSetClick
    }));

    if (adding) 
    {
        return (
            <div className="addSetBlock addSetBlockInput" key="add-input">
                <div className="addSetInputContainer">
                    <div>
                        <input
                            type="text"
                            value={newSetName}
                            autoFocus
                            placeholder={t('dashboard.setName')}
                            maxLength={50}
                            onChange={e => setNewSetName(e.target.value)}
                            onKeyDown={async e => {
                                if (e.key === 'Enter') await handleAddSetConfirm();
                                if (e.key === 'Escape') handleAddSetCancel();
                            }}
                            className="addSetInput"
                            disabled={addingLoading}
                        />
                        <small style={{ color: '#666', fontSize: '0.8rem' }}>
                            {newSetName.length}/50 {t('dashboard.characters')}
                        </small>
                    </div>
                    <div>
                        <input
                            type="text"
                            value={newSetDescription}
                            placeholder={t('dashboard.description')}
                            maxLength={100}
                            onChange={e => setNewSetDescription(e.target.value)}
                            className="addSetInput"
                            disabled={addingLoading}
                        />
                        <small style={{ color: '#666', fontSize: '0.8rem' }}>
                            {newSetDescription.length}/100 {t('dashboard.characters')}
                        </small>
                    </div>
                    <div className="language-list">
                        <select
                            value={newSetDefaultLanguage}
                            onChange={e => setNewSetDefaultLanguage(e.target.value)}
                            className="addSetInput"
                            disabled={addingLoading}
                            style={{ flex: 1 }}
                        >
                            {languageOptions.map(opt => (
                                <option key={opt.code} value={opt.code}>{opt.name}</option>
                            ))}
                        </select>
                        <span style={{ fontSize: '1.5rem', marginBottom: '1.25rem' }}>&rarr;</span>
                        <select
                            value={newSetTranslationLanguage}
                            onChange={e => setNewSetTranslationLanguage(e.target.value)}
                            className="addSetInput"
                            disabled={addingLoading}
                            style={{ flex: 1 }}
                        >
                            {languageOptions.map(opt => (
                                <option key={opt.code} value={opt.code}>{opt.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="addSetButtons">
                        <button className="addSetImport" title={t('dashboard.import.title')} onClick={onImportClick}>
                            <AiOutlineDownload/>
                        </button>
                        <button 
                            onClick={async () => await handleAddSetConfirm()} 
                            className="addSetConfirm" 
                            disabled={newSetName.trim() === '' || addingLoading}
                        >
                            {addingLoading ? t('dashboard.adding') : t('dashboard.add')}
                        </button>
                        <button onClick={handleAddSetCancel} className="addSetCancel" disabled={addingLoading}>
                            {t('dashboard.cancel')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="addSetBlock" onClick={handleAddSetClick} key="add">
            <span>+</span>
            <p>{t('dashboard.addNewSet')}</p>
        </div>
    );
});

DashboardAddNewSet.displayName = 'DashboardAddNewSet';

export default DashboardAddNewSet;
