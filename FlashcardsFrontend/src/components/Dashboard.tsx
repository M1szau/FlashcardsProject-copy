import { useNavigate } from "react-router-dom";
import { useEffect, useState } from 'react';
import { AiFillEdit, AiFillDelete, AiOutlineUpload, AiOutlineDownload } from "react-icons/ai";
import Navbar from './Navbar.tsx';
import { useTranslation } from "react-i18next";

type SetType = 
{
    id: string;
    name: string;
    description: string;
    defaultLanguage: string;
    translationLanguage: string;
    owner: string;
};

export default function Dashboard() 
{
    const { t } = useTranslation();

    //Language options with translation keys
    const languageOptions = [
        { code: 'PL', name: t('languages.PL') },
        { code: 'EN', name: t('languages.EN') },
        { code: 'DE', name: t('languages.DE') },
        { code: 'ES', name: t('languages.ES') }
    ];

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

    //Function to truncate text
    const truncateText = (text: string, maxLength: number) => 
    {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    //Function to get translated language name
    const getLanguageName = (langCode: string) => 
    {
        const languageMap: { [key: string]: string } = 
        {
            'PL': t('languages.PL'),
            'EN': t('languages.EN'), 
            'DE': t('languages.DE'),
            'ES': t('languages.ES'),

        };
        return languageMap[langCode] || langCode;
    };

    //Fetch sets from backend on mount
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

                if (!res.ok) 
                {
                    alert('Failed to load sets.');
                    return;
                }

                const data = await res.json();
                setSets(data.sets || []);
            } 
            catch (err) 
            {
                alert('Failed to load sets.');
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
        if (window.confirm(t('dashboard.deleteSet'))) 
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
    function handleExportClick(setId: string) 
    {
        setExportingSetId(setId);
    }

    function handleExportCancel() 
    {
        setExportingSetId(null);
        setExportFormat('json');
    }

    async function handleExportConfirm() 
    {
        if (!exportingSetId) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/sets/${exportingSetId}/export?format=${exportFormat}`, 
            {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) 
            {
                throw new Error('Export failed');
            }

            const setData = sets.find(s => s.id === exportingSetId);
            const fileName = `${setData?.name || 'flashcard-set'}.${exportFormat}`;

            if (exportFormat === 'json') 
            {
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

    function downloadFile(blob: Blob, fileName: string) 
    {
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
    function handleImportClick() 
    {
        setShowImportModal(true);
    }

    function handleImportCancel() 
    {
        setShowImportModal(false);
        setImportFile(null);
        setImportLoading(false);
    }

    function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) 
    {
        const file = event.target.files?.[0];
        if (file) {
            //Validate file type
            const isValidFile = file.type === 'application/json' || 
                               file.type === 'text/csv' || 
                               file.name.endsWith('.json') || 
                               file.name.endsWith('.csv');
            
            if (!isValidFile) 
            {
                alert(t('dashboard.import.wrongFormat'));
                return;
            }
            
            setImportFile(file);
        }
    }

    async function handleImportConfirm() 
    {
        if (!importFile || importLoading) return;
        
        setImportLoading(true);
        try 
        {
            const token = localStorage.getItem('token');
            
            //Read file content
            const fileContent = await readFileContent(importFile);
            let importData;

            if (importFile.name.toLowerCase().endsWith('.json')) 
            {
                //Parse JSON file
                try {
                    importData = JSON.parse(fileContent);
                } catch (error) {
                    throw new Error(t('dashboard.import.invalidJson'));
                }
            } else if (importFile.name.toLowerCase().endsWith('.csv')) 
            {
                //Parse CSV file
                importData = parseCsvContent(fileContent);
            } else {
                throw new Error(t('dashboard.import.unsupportedFormat'));
            }

            //Validate data structure
            if (!importData.set || !importData.set.name) 
            {
                throw new Error(t('dashboard.import.missingSetInfo'));
            }

            const response = await fetch('/api/sets/import', 
            {
                method: 'POST',
                headers: 
                {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(importData)
            });

            if (!response.ok) 
            {
                const errorData = await response.json();
                throw new Error(errorData.message || t('dashboard.import.failedMessage', { error: errorData.error || 'Unknown error' }));
            }

            const result = await response.json();
            
            //Add the new set to the sets list
            setSets(prev => [...prev, result.set]);
            
            alert(t('dashboard.import.successMessage', { setName: result.set.name, count: result.flashcards.length }));
            handleImportCancel();
        } catch (error) {
            alert(t('dashboard.import.failedMessage', { error: error instanceof Error ? error.message : 'Unknown error' }));
        } finally {
            setImportLoading(false);
        }
    }

    //Function to read file content
    function readFileContent(file: File): Promise<string> 
    {
        return new Promise((resolve, reject) => 
        {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error(t('dashboard.import.failedToRead')));
            reader.readAsText(file);
        });
    }

    //Function to parse CSV content
    function parseCsvContent(csvContent: string) 
    {
        const lines = csvContent.split('\n').filter(line => line.trim());
        if (lines.length < 2) 
        {
            throw new Error(t('dashboard.import.invalidCsv'));
        }

        //Skip header line
        const dataLines = lines.slice(1);
        const firstDataLine = dataLines[0];
        const csvData = parseCsvLine(firstDataLine);

        if (csvData.length < 8) 
        {
            throw new Error(t('dashboard.import.insufficientColumns'));
        }

        const setData = 
        {
            name: csvData[0],
            description: csvData[1],
            defaultLanguage: csvData[2] || 'EN',
            translationLanguage: csvData[3] || 'PL'
        };

        const flashcardsData = dataLines.map(line => 
        {
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
    function parseCsvLine(line: string): string[] 
    {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) 
        {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') 
            {
                if (inQuotes && nextChar === '"') 
                {
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
                            placeholder={t('dashboard.setName')}
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
                        <button className="addSetImport" title={t('dashboard.import.title')} onClick={handleImportClick}>
                            <AiOutlineDownload/>
                        </button>
                        <button onClick={async () => await handleAddSetConfirm()} className="addSetConfirm" disabled={newSetName.trim() === '' || addingLoading}>
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
    else 
    {
        allBlocks.push(
            <div className="addSetBlock" onClick={handleAddSetClick} key="add">
                <span>+</span>
                <p>{t('dashboard.addNewSet')}</p>
            </div>
        );
    }
    
    if (Array.isArray(sets)) {
        sets.forEach((set, i) => 
        {
            // Skip invalid set objects
            if (!set || typeof set !== 'object' || !set.id || !set.name) {
                return;
            }
            
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
                            <input type="text" value={editSetDescription} placeholder={t('dashboard.description')} maxLength={100} onChange={e => setEditSetDescription(e.target.value)} className="addSetInput"/>
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
                            <button onClick={handleEditSetConfirm} className="addSetConfirm">{t('dashboard.save')}</button>
                            <button onClick={handleEditSetCancel} className="addSetCancel">{t('dashboard.cancel')}</button>
                        </div>
                    </div>
                </div>
            );
        } 
        else 
        {
            allBlocks.push(
                <div className="setBlock" key={set.id} onClick={() => navigate(`/set/${set.id}`)}>
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
                        <button className="setEditBtn" title={t('dashboard.edit')} onClick={e => { e.stopPropagation(); handleEditSet(i); }}>
                            <span><AiFillEdit /></span>
                        </button>
                        <button className="setDeleteBtn" title={t('dashboard.deleteSet')} onClick={e => { e.stopPropagation(); handleDeleteSet(i); }}>
                            <span><AiFillDelete /></span>
                        </button>
                        <button className="setExportBtn" title={t('dashboard.exportAction')} onClick={e => { e.stopPropagation(); handleExportClick(set.id); }}>
                            <span><AiOutlineUpload /></span>
                        </button>
                    </div>
                </div>
            );
        }
    });
    } // end if Array.isArray(sets)

    // Show message when no sets exist and not adding
    if (!adding && Array.isArray(sets) && sets.length === 0) {
        allBlocks.push(
            <div key="no-sets" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                <p>No sets found. Create your first set!</p>
            </div>
        );
    }

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
                        <h3>{t('dashboard.export.title')}</h3>
                        <p>{t('dashboard.export.chooseFormat')}</p>
                        <div className="export-format-options">
                            <label>
                                <input type="radio" value="json" checked={exportFormat === 'json'} onChange={e => setExportFormat(e.target.value as 'json' | 'csv')}/>
                                {t('dashboard.export.jsonFormat')}
                            </label>
                            <label>
                                <input type="radio" value="csv" checked={exportFormat === 'csv'} onChange={e => setExportFormat(e.target.value as 'json' | 'csv')}/>
                                {t('dashboard.export.csvFormat')}
                            </label>
                        </div>
                        <div className="export-modal-buttons">
                            <button onClick={handleExportConfirm} className="export-confirm-btn">
                                {t('dashboard.exportAction')}
                            </button>
                            <button onClick={handleExportCancel} className="export-cancel-btn">
                                {t('dashboard.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {showImportModal && (
                <div className="import-modal">
                    <div className="import-modal-content">
                        <h3>{t('dashboard.import.title')}</h3>

                        <div className="import-instructions">
                            <h4>{t('dashboard.import.supportedFormats')}</h4>
                            <div className="format-description">
                                <h5>{t('dashboard.import.jsonFormat')}</h5>
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
                                <h5>{t('dashboard.import.csvFormat')}</h5>
                                <p>{t('dashboard.import.csvHeaders')}</p>
                                <pre>{`"My Set","Description","EN","PL","Hello","Cześć","EN","PL","false","2024-01-01"`}</pre>
                            </div>
                        </div>

                        <div className="import-file-section">
                            <input type="file" accept=".json,.csv" onChange={handleFileSelect} className="import-file-input"/>
                            {importFile && (
                                <p className="selected-file">
                                    {t('dashboard.import.selectedFile')}: {importFile.name}
                                </p>
                            )}
                        </div>

                        <div className="import-modal-buttons">
                            <button  onClick={handleImportConfirm} className="import-confirm-btn" disabled={!importFile || importLoading}>
                                {importLoading ? 'Importing...' : 'Import'}
                            </button>
                            <button onClick={handleImportCancel} className="import-cancel-btn" disabled={importLoading}>
                                {t('dashboard.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}