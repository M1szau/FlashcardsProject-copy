import { API_BASE_URL } from "../../apiBaseUrl";
import { useState, forwardRef, useImperativeHandle } from 'react';
import { AiFillEdit } from "react-icons/ai";
import { useTranslation } from "react-i18next";
import type { DashboardEditSetBtnProps, DashboardEditSetBtnRef } from '../../types and interfaces/interfaces.ts';

const DashboardEditSetBtn = forwardRef<DashboardEditSetBtnRef, DashboardEditSetBtnProps>((props, ref) => 
{
    const { set, setIndex, onEditSuccess, getLanguageName } = props;
    const { t } = useTranslation();

    const [isEditing, setIsEditing] = useState(false);
    const [editSetName, setEditSetName] = useState('');
    const [editSetDescription, setEditSetDescription] = useState('');

    const handleStartEdit = () => 
    {
        setEditSetName(set.name);
        setEditSetDescription(set.description || '');
        setIsEditing(true);
    };

    const handleEditSetConfirm = async () => 
    {
        if (editSetName.trim() === '') return;
        
        const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/api/sets/${set.id}`, 
        {
            method: 'PUT',
            headers: 
            {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(
            {
                name: editSetName.trim(),
                description: editSetDescription.trim()
            })
        });
        
        if (!res.ok) 
        {
            alert('Failed to edit set.');
            return;
        }
        
        const data = await res.json();
        onEditSuccess(data.set, setIndex);
        setIsEditing(false);
    };

    const handleEditSetCancel = () => 
    {
        setEditSetName('');
        setEditSetDescription('');
        setIsEditing(false);
    };

    useImperativeHandle(ref, () => (
    {
        handleEditSet: handleStartEdit,
        isEditing: isEditing
    }));

    //If this set is being edited, render the edit form
    if (isEditing) 
    {
        return (
            <div className="setBlock editing">
                <div className="addSetInputContainer">
                    <div>
                        <input
                            type="text"
                            value={editSetName}
                            autoFocus
                            placeholder={t('dashboard.setName')}
                            maxLength={50}
                            onChange={e => setEditSetName(e.target.value)}
                            onKeyDown={e => 
                            {
                                if (e.key === 'Enter') handleEditSetConfirm();
                                if (e.key === 'Escape') handleEditSetCancel();
                            }}
                            className="addSetInput"
                        />
                        <small style={{ color: '#666', fontSize: '0.8rem' }}>
                            {editSetName.length}/50 {t('dashboard.characters')}
                        </small>
                    </div>
                    <div>
                        <input 
                            type="text" 
                            value={editSetDescription} 
                            placeholder={t('dashboard.description')} 
                            maxLength={100} 
                            onChange={e => setEditSetDescription(e.target.value)} 
                            className="addSetInput"
                        />
                        <small style={{ color: '#666', fontSize: '0.8rem' }}>
                            {editSetDescription.length}/100 {t('dashboard.characters')}
                        </small>
                    </div>
                    <div className="edit-language">
                        <span>{getLanguageName(set.defaultLanguage)}</span>
                        <span className="edit-language-arrow">&rarr;</span>
                        <span>{getLanguageName(set.translationLanguage)}</span>
                    </div>
                    <div className="addSetButtons">
                        <button onClick={handleEditSetConfirm} className="addSetConfirm">
                            {t('dashboard.save')}
                        </button>
                        <button onClick={handleEditSetCancel} className="addSetCancel">
                            {t('dashboard.cancel')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    //Just render the edit button
    return (
        <button 
            className="setEditBtn" 
            title={t('dashboard.edit')} 
            onClick={e => { 
                e.stopPropagation(); 
                handleStartEdit(); 
            }}
        >
            <span><AiFillEdit /></span>
        </button>
    );
});

DashboardEditSetBtn.displayName = 'DashboardEditSetBtn';

export default DashboardEditSetBtn;
