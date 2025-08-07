import { useState, forwardRef, useImperativeHandle } from 'react';
import { AiFillEdit, AiFillDelete, AiOutlineUpload } from "react-icons/ai";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { DashboardSetBlockProps, DashboardSetBlockRef } from '../../types and interfaces/interfaces.ts';


const DashboardSetBlock = forwardRef<DashboardSetBlockRef, DashboardSetBlockProps>((props, ref) => 
{
    const { set, setIndex, onEditSuccess, onDeleteSuccess, onExportClick, getLanguageName, truncateText } = props;
    const { t } = useTranslation();
    const navigate = useNavigate();

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
        const res = await fetch(`/api/sets/${set.id}`, 
        {
            method: 'PUT',
            headers: 
            {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
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

    const handleDeleteSet = async () => 
    {
        if (window.confirm(t('dashboard.deleteSet'))) 
        {
            const token = localStorage.getItem('token');
            await fetch(`/api/sets/${set.id}`, 
            {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            onDeleteSuccess(setIndex);
        }
    };

    useImperativeHandle(ref, () => ({}));

    // If editing, render the edit form
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

    // Otherwise, render the normal set block
    return (
        <div className="setBlock" onClick={() => navigate(`/set/${set.id}`)}>
            <div className='setBlock-name' title={set.name}>
                {truncateText(set.name, 25)}
            </div>
            <div className='setBlock-description' title={set.description || ''}>
                {set.description ? truncateText(set.description, 40) : t('dashboard.noDescription')}
            </div>
            <div className="setBlock-languages">
                <span>
                    {getLanguageName(set.defaultLanguage)}
                </span>
                <span className="language-arrow">&rarr;</span>
                <span>
                    {getLanguageName(set.translationLanguage)}
                </span>
            </div>
            <div className="setBlockActions">
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
                <button 
                    className="setDeleteBtn" 
                    title={t('dashboard.deleteSet')} 
                    onClick={e => { 
                        e.stopPropagation(); 
                        handleDeleteSet(); 
                    }}
                >
                    <span><AiFillDelete /></span>
                </button>
                <button 
                    className="setExportBtn" 
                    title={t('dashboard.exportAction')} 
                    onClick={e => { 
                        e.stopPropagation(); 
                        onExportClick(set.id); 
                    }}
                >
                    <span><AiOutlineUpload /></span>
                </button>
            </div>
        </div>
    );
});

DashboardSetBlock.displayName = 'DashboardSetBlock';

export default DashboardSetBlock;
