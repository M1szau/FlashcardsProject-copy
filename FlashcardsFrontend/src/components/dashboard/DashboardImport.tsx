import { API_BASE_URL } from "../../apiBaseUrl";
import { useState, forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from "react-i18next";
import DashboardImportModal from './DashboardImportModal.tsx';
import type { SetType } from '../../types and interfaces/types.ts';
import type { DashboardImportProps, DashboardImportRef } from '../../types and interfaces/interfaces.ts';

const DashboardImport = forwardRef<DashboardImportRef, DashboardImportProps>(({ onImportSuccess }, ref) => 
{
    const { t } = useTranslation();
    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importLoading, setImportLoading] = useState(false);

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

    function handleImportSuccess(newSet: SetType) 
    {
        setShowImportModal(false);
        setImportFile(null);
        setImportLoading(false);
        onImportSuccess(newSet);
    }

    useImperativeHandle(ref, () => (
    {
        handleImportClick
    }));

    function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) 
    {
        const file = event.target.files?.[0];
        if (file) 
        {
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
                try 
                {
                    importData = JSON.parse(fileContent);
                } catch (error) {
                    throw new Error(t('dashboard.import.invalidJson'));
                }
            } else if (importFile.name.toLowerCase().endsWith('.csv')) {
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

            const response = await fetch(`${API_BASE_URL}/api/sets/import`, 
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
            
            //Show success message with proper fallbacks
            const setName = result.set?.name || 'Unknown Set';
            const flashcardCount = result.flashcards?.length || 0;
            alert(t('dashboard.import.successMessage', { setName, count: flashcardCount }));
            
            //Call success callback with the new set
            handleImportSuccess(result.set);
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

    //Function to parse CSV line
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

    if (!showImportModal) return null;

    return (
        <DashboardImportModal
            importFile={importFile}
            importLoading={importLoading}
            onFileSelect={handleFileSelect}
            onImportConfirm={handleImportConfirm}
            onImportCancel={handleImportCancel}
        />
    );
});

DashboardImport.displayName = 'DashboardImport';

export default DashboardImport;