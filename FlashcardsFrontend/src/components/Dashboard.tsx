import { useNavigate } from "react-router-dom";
import { useEffect, useState } from 'react';
import { AiFillEdit, AiFillDelete } from "react-icons/ai";
import Navbar from './Navbar.tsx';

type SetType = 
{
    id: string;
    name: string;
    description: string;
    defaultLanguage: string;
    translationLanguage: string;
    owner: string;
};

const languageOptions = [
    { code: 'PL', name: 'Polish' },
    { code: 'EN', name: 'English' },
    { code: 'DE', name: 'German' },
    { code: 'ES', name: 'Spanish' },
];

export default function Dashboard() 
{
    const navigate = useNavigate();
    const [sets, setSets] = useState<SetType[]>([]);
    const [adding, setAdding] = useState(false);
    const [newSetName, setNewSetName] = useState('');
    const [newSetDescription, setNewSetDescription] = useState('');
    const [newSetDefaultLanguage, setNewSetDefaultLanguage] = useState('PL');
    const [newSetTranslationLanguage, setNewSetTranslationLanguage] = useState('EN');
    const [editingIdx, setEditingIdx] = useState<number | null>(null);
    const [editSetName, setEditSetName] = useState('');
    const [editSetDescription, setEditSetDescription] = useState('');
    const [addingLoading, setAddingLoading] = useState(false);

    // Helper function to truncate text
    const truncateText = (text: string, maxLength: number) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    // Fetch sets from backend on mount
    useEffect(() => 
    {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login', { replace: true });
            return;
        }

        async function fetchSets() 
        {
            try 
            {
                const res = await fetch('/api/sets', 
                {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.status === 401 || res.status === 403) 
                {
                    localStorage.removeItem('token');
                    navigate('/login', { replace: true });
                    return;
                }
                const data = await res.json();
                setSets(data.sets || []);
            } 
            catch (err) 
            {
                localStorage.removeItem('token');
                navigate('/login', { replace: true });
            }
        }
        fetchSets();
    }, [navigate]);

    //Add set functionality
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
            const token = localStorage.getItem('token');
            const res = await fetch('/api/sets', 
            {
                method: 'POST',
                headers: 
                {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newSetName.trim(),
                    description: newSetDescription.trim(),
                    defaultLanguage: newSetDefaultLanguage,
                    translationLanguage: newSetTranslationLanguage
                })
            });
            if (!res.ok) throw new Error('Failed to add set');
            const data = await res.json();
            setSets(prev => [...prev, data.set]); 
            setAdding(false);
            setNewSetName('');
            setNewSetDescription('');
            setNewSetDefaultLanguage('PL');
            setNewSetTranslationLanguage('EN');
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

    function handleEditSet(idx: number) 
    {
        setEditingIdx(idx);
        setEditSetName(sets[idx].name);
        setEditSetDescription(sets[idx].description || '');
    }

    //Edit set functionality
    async function handleEditSetConfirm() 
    {
        if (editingIdx === null || editSetName.trim() === '') return;
        const setToEdit = sets[editingIdx];
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/sets/${setToEdit.id}`, 
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
        setSets(prev =>
            prev.map((s, i) => i === editingIdx ? data.set : s)
        );
        setEditingIdx(null);
        setEditSetName('');
        setEditSetDescription('');
    }

    function handleEditSetCancel() 
    {
        setEditingIdx(null);
        setEditSetName('');
        setEditSetDescription('');
    }

    //Delete set functionality
    async function handleDeleteSet(idx: number) 
    {
        const setToDelete = sets[idx];
        if (window.confirm('Delete this set?')) 
        {
            const token = localStorage.getItem('token');
            await fetch(`/api/sets/${setToDelete.id}`, 
            {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            setSets(prev => prev.filter((_, i) => i !== idx));
        }
    }

    // Blocks functionality
    const allBlocks = [];
    
    if (adding) 
    {
        allBlocks.push(
            <div className="addSetBlock addSetBlockInput" key="add-input">
                <div className="addSetInputContainer">
                    <div>
                        <input
                            type="text"
                            value={newSetName}
                            autoFocus
                            placeholder="Set name"
                            maxLength={50}
                            onChange={e => setNewSetName(e.target.value)}
                            onKeyDown={async e => 
                            {
                                if (e.key === 'Enter') await handleAddSetConfirm();
                                if (e.key === 'Escape') handleAddSetCancel();
                            }}
                            className="addSetInput"
                            disabled={addingLoading}
                        />
                        <small style={{ color: '#666', fontSize: '0.8rem' }}>
                            {newSetName.length}/50 characters
                        </small>
                    </div>
                    <div>
                        <input
                            type="text"
                            value={newSetDescription}
                            placeholder="Description"
                            maxLength={100}
                            onChange={e => setNewSetDescription(e.target.value)}
                            className="addSetInput"
                            disabled={addingLoading}
                        />
                        <small style={{ color: '#666', fontSize: '0.8rem' }}>
                            {newSetDescription.length}/100 characters
                        </small>
                    </div>
                    <div className = 'language-list'>
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
                        <button
                            onClick={async () => await handleAddSetConfirm()}
                            className="addSetConfirm"
                            disabled={newSetName.trim() === '' || addingLoading}
                        >
                            {addingLoading ? 'Adding...' : 'Add'}
                        </button>
                        <button
                            onClick={handleAddSetCancel}
                            className="addSetCancel"
                            disabled={addingLoading}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    } 
    else 
    {
        allBlocks.push(
            <div className="addSetBlock" onClick={handleAddSetClick} key="add">
                <span>+</span>
                <p>Add new set</p>
            </div>
        );
    }
    
    sets.forEach((set, i) => 
    {
        if (editingIdx === i) 
        {
            allBlocks.push(
                <div className="setBlock editing" key={set.id}>
                    <div className="addSetInputContainer">
                        <div>
                            <input
                                type="text"
                                value={editSetName}
                                autoFocus
                                placeholder="Set name"
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
                                {editSetName.length}/50 characters
                            </small>
                        </div>
                        <div>
                            <input
                                type="text"
                                value={editSetDescription}
                                placeholder="Description"
                                maxLength={100}
                                onChange={e => setEditSetDescription(e.target.value)}
                                className="addSetInput"
                            />
                            <small style={{ color: '#666', fontSize: '0.8rem' }}>
                                {editSetDescription.length}/100 characters
                            </small>
                        </div>
                        <div className="edit-language">
                            <span>{set.defaultLanguage}</span>
                            <span className="edit-language-arrow">&rarr;</span>
                            <span>{set.translationLanguage}</span>
                        </div>
                        <div className="addSetButtons">
                            <button onClick={handleEditSetConfirm} className="addSetConfirm">Save</button>
                            <button onClick={handleEditSetCancel} className="addSetCancel">Cancel</button>
                        </div>
                    </div>
                </div>
            );
        } 
        else 
        {
            allBlocks.push(
                <div
                    className="setBlock"
                    key={set.id}
                    onClick={() => navigate(`/set/${set.id}`)}
                >
                    <div className='setBlock-name' title={set.name}>
                        {truncateText(set.name, 25)}
                    </div>
                    <div className='setBlock-description' title={set.description || ''}>
                        {set.description ? truncateText(set.description, 40) : 'No description'}
                    </div>
                    <div className="setBlock-languages">
                        <span>
                            {languageOptions.find(opt => opt.code === set.defaultLanguage)?.name || set.defaultLanguage}
                        </span>
                        <span className="language-arrow">&rarr;</span>
                        <span>
                            {languageOptions.find(opt => opt.code === set.translationLanguage)?.name || set.translationLanguage}
                        </span>
                    </div>
                    <div className="setBlockActions">
                        <button
                            className="setEditBtn"
                            title="Edit set"
                            onClick={e => { e.stopPropagation(); handleEditSet(i); }}
                        >
                            <span><AiFillEdit /></span>
                        </button>
                        <button
                            className="setDeleteBtn"
                            title="Delete set"
                            onClick={e => { e.stopPropagation(); handleDeleteSet(i); }}
                        >
                            <span><AiFillDelete /></span>
                        </button>
                    </div>
                </div>
            );
        }
    });

    return (
        <main className="dashboardMain">
            <Navbar />
            <section className="setsGrid">
                {allBlocks}
            </section>
        </main>
    );
}