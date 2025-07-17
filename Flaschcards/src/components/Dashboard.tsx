import { useNavigate } from "react-router-dom";
import { useEffect, useState } from 'react';
import { AiFillEdit, AiFillDelete } from "react-icons/ai";
import Navbar from './Navbar.tsx';

export default function Dashboard() 
{
    const navigate = useNavigate();
    const [sets, setSets] = useState<{ id: string, name: string }[]>([]);
    const [adding, setAdding] = useState(false);
    const [newSetName, setNewSetName] = useState('');
    const [editingIdx, setEditingIdx] = useState<number | null>(null);
    const [editSetName, setEditSetName] = useState('');
    const [addingLoading, setAddingLoading] = useState(false);

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
                // Network or server error
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
    }

    async function handleAddSetConfirm() 
    {
        if (newSetName.trim() === '' || addingLoading) return;
        setAddingLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/sets', 
                {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name: newSetName.trim() })
            });
            if (!res.ok) throw new Error('Failed to add set');
            const data = await res.json();
            setSets(prev => [...prev, data.set]); 
            setAdding(false);
            setNewSetName('');
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
        setAddingLoading(false);
    }

    function handleEditSet(idx: number) 
    {
        setEditingIdx(idx);
        setEditSetName(sets[idx].name);
    }

    //Edit set name functionality
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
            body: JSON.stringify({ name: editSetName.trim() })
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
    }

    function handleEditSetCancel() 
    {
        setEditingIdx(null);
        setEditSetName('');
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
                    <input
                        type="text"
                        value={newSetName}
                        autoFocus
                        placeholder="Set name"
                        onChange={e => setNewSetName(e.target.value)}
                        //Keyboard shortcuts
                        onKeyDown={async e => 
                        {
                            if (e.key === 'Enter') await handleAddSetConfirm();
                            if (e.key === 'Escape') handleAddSetCancel();
                        }}
                        className="addSetInput"
                        disabled={addingLoading}
                    />
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
            allBlocks.push
            (
                <div className="setBlock editing" key={set.id}>
                    <div className="addSetInputContainer">
                        <input
                            type="text"
                            value={editSetName}
                            autoFocus
                            placeholder="Set name"
                            onChange={e => setEditSetName(e.target.value)}
                            //Keyboard shortcuts
                            onKeyDown={e => 
                            {
                                if (e.key === 'Enter') handleEditSetConfirm();
                                if (e.key === 'Escape') handleEditSetCancel();
                            }}
                            className="addSetInput"
                        />
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
            allBlocks.push
            (
                <div
                    className="setBlock"
                    key={set.id}
                    onClick={() => navigate(`/set/${set.id}`)}
                >
                    <div className="setName">{set.name}</div>
                    <div className="setBlockActions">
                        <button
                            className="setEditBtn"
                            title="Edit set name"
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