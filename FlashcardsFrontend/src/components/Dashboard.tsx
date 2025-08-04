import { useNavigate } from "react-router-dom";
import { useEffect, useState } from 'react';
import { AiFillEdit, AiFillDelete, AiOutlineUpload, AiOutlineDownload } from "react-icons/ai";
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
    const [exportingSetId, setExportingSetId] = useState<string | null>(null);
    const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importLoading, setImportLoading] = useState(false);

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

    //Export set functionality
    function handleExportClick(setId: string) {
        setExportingSetId(setId);
    }

    function handleExportCancel() {
        setExportingSetId(null);
        setExportFormat('json');
    }

    async function handleExportConfirm() {
        if (!exportingSetId) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/sets/${exportingSetId}/export?format=${exportFormat}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Export failed');
            }

            const setData = sets.find(s => s.id === exportingSetId);
            const fileName = `${setData?.name || 'flashcard-set'}.${exportFormat}`;

            if (exportFormat === 'json') {
                const data = await response.json();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                downloadFile(blob, fileName);
            } else {
                const csvText = await response.text();
                const blob = new Blob([csvText], { type: 'text/csv' });
                downloadFile(blob, fileName);
            }

            setExportingSetId(null);
            setExportFormat('json');
        } catch (error) {
            alert('Failed to export set.');
        }
    }

    function downloadFile(blob: Blob, fileName: string) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    //Import set functionality
    function handleImportClick() {
        setShowImportModal(true);
    }

    function handleImportCancel() {
        setShowImportModal(false);
        setImportFile(null);
        setImportLoading(false);
    }

    function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file type
            const isValidFile = file.type === 'application/json' || 
                               file.type === 'text/csv' || 
                               file.name.endsWith('.json') || 
                               file.name.endsWith('.csv');
            
            if (!isValidFile) {
                alert('Please select a valid JSON or CSV file.');
                return;
            }
            
            setImportFile(file);
        }
    }

    async function handleImportConfirm() {
        if (!importFile || importLoading) return;
        
        setImportLoading(true);
        try {
            const token = localStorage.getItem('token');
            
            // Read file content
            const fileContent = await readFileContent(importFile);
            let importData;

            if (importFile.name.toLowerCase().endsWith('.json')) {
                // Parse JSON file
                try {
                    importData = JSON.parse(fileContent);
                } catch (error) {
                    throw new Error('Invalid JSON format');
                }
            } else if (importFile.name.toLowerCase().endsWith('.csv')) {
                // Parse CSV file
                importData = parseCsvContent(fileContent);
            } else {
                throw new Error('Unsupported file format');
            }

            // Validate data structure
            if (!importData.set || !importData.set.name) {
                throw new Error('Invalid file format: missing set information');
            }

            const response = await fetch('/api/sets/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(importData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Import failed');
            }

            const result = await response.json();
            
            // Add the new set to the sets list
            setSets(prev => [...prev, result.set]);
            
            alert(`Successfully imported set "${result.set.name}" with ${result.flashcardsCount} flashcards.`);
            handleImportCancel();
        } catch (error) {
            alert(`Failed to import set: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setImportLoading(false);
        }
    }

    // Helper function to read file content
    function readFileContent(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    // Helper function to parse CSV content
    function parseCsvContent(csvContent: string) {
        const lines = csvContent.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            throw new Error('CSV file must have header and at least one data row');
        }

        // Skip header line
        const dataLines = lines.slice(1);
        const firstDataLine = dataLines[0];
        const csvData = parseCsvLine(firstDataLine);

        if (csvData.length < 8) {
            throw new Error('Invalid CSV format: insufficient columns');
        }

        const setData = {
            name: csvData[0],
            description: csvData[1],
            defaultLanguage: csvData[2] || 'EN',
            translationLanguage: csvData[3] || 'PL'
        };

        const flashcardsData = dataLines.map(line => {
            const data = parseCsvLine(line);
            return {
                content: data[4],
                translation: data[5],
                language: data[6] || setData.defaultLanguage,
                translationLang: data[7] || setData.translationLanguage,
                known: data[8] === 'true'
            };
        }).filter(card => card.content && card.translation);

        return {
            set: setData,
            flashcards: flashcardsData
        };
    }

    // Helper function to parse CSV line
    function parseCsvLine(line: string): string[] {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    current += '"';
                    i++; // Skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
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
                        <button className="addSetImport" title="Import set" onClick={handleImportClick}>
                            <AiOutlineDownload/>
                        </button>
                        <button onClick={async () => await handleAddSetConfirm()} className="addSetConfirm" disabled={newSetName.trim() === '' || addingLoading}>
                            {addingLoading ? 'Adding...' : 'Add'}
                        </button>
                        <button onClick={handleAddSetCancel} className="addSetCancel" disabled={addingLoading}>
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
                        <button className="setEditBtn" title="Edit set" onClick={e => { e.stopPropagation(); handleEditSet(i); }}>
                            <span><AiFillEdit /></span>
                        </button>
                        <button className="setDeleteBtn" title="Delete set" onClick={e => { e.stopPropagation(); handleDeleteSet(i); }}>
                            <span><AiFillDelete /></span>
                        </button>
                        <button className="setExportBtn" title="Export set" onClick={e => { e.stopPropagation(); handleExportClick(set.id); }}>
                            <span><AiOutlineUpload /></span>
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
            
            {/* Export Modal */}
            {exportingSetId && (
                <div className="export-modal">
                    <div className="export-modal-content">
                        <h3>Export Set</h3>
                        <p>Choose export format:</p>
                        <div className="export-format-options">
                            <label>
                                <input type="radio" value="json" checked={exportFormat === 'json'} onChange={e => setExportFormat(e.target.value as 'json' | 'csv')}/>
                                JSON Format
                            </label>
                            <label>
                                <input type="radio" value="csv" checked={exportFormat === 'csv'} onChange={e => setExportFormat(e.target.value as 'json' | 'csv')}/>
                                CSV Format
                            </label>
                        </div>
                        <div className="export-modal-buttons">
                            <button onClick={handleExportConfirm} className="export-confirm-btn">
                                Export
                            </button>
                            <button onClick={handleExportCancel} className="export-cancel-btn">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {showImportModal && (
                <div className="import-modal">
                    <div className="import-modal-content">
                        <h3>Import Flashcard Set</h3>
                        
                        <div className="import-instructions">
                            <h4>Supported File Formats:</h4>
                            <div className="format-description">
                                <h5>JSON Format:</h5>
                                <pre>{`{
  "set": {
    "name": "My Set",
    "description": "Description",
    "defaultLanguage": "EN",
    "translationLanguage": "PL"
  },
  "flashcards": [
    {
      "content": "Hello",
      "translation": "Cześć",
      "language": "EN",
      "translationLang": "PL",
      "known": false
    }
  ]
}`}</pre>
                            </div>
                            
                            <div className="format-description">
                                <h5>CSV Format:</h5>
                                <p>Headers: Set Name, Set Description, Default Language, Translation Language, Content, Translation, Content Language, Translation Language, Known, Created At</p>
                                <pre>{`"My Set","Description","EN","PL","Hello","Cześć","EN","PL","false","2024-01-01"`}</pre>
                            </div>
                        </div>

                        <div className="import-file-section">
                            <input
                                type="file"
                                accept=".json,.csv"
                                onChange={handleFileSelect}
                                className="import-file-input"
                            />
                            {importFile && (
                                <p className="selected-file">
                                    Selected: {importFile.name}
                                </p>
                            )}
                        </div>

                        <div className="import-modal-buttons">
                            <button 
                                onClick={handleImportConfirm} 
                                className="import-confirm-btn"
                                disabled={!importFile || importLoading}
                            >
                                {importLoading ? 'Importing...' : 'Import'}
                            </button>
                            <button 
                                onClick={handleImportCancel} 
                                className="import-cancel-btn"
                                disabled={importLoading}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}