import { useState, forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from "react-i18next";
import type { DashboardExportProps, DashboardExportRef } from '../../types and interfaces/interfaces.ts';


const DashboardExport = forwardRef<DashboardExportRef, DashboardExportProps>(({ sets }, ref) => 
{
    const { t } = useTranslation();
    const [exportingSetId, setExportingSetId] = useState<string | null>(null);
    const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');

    function handleExportClick(setId: string) 
    {
        setExportingSetId(setId);
    }

    function handleExportCancel() 
    {
        setExportingSetId(null);
        setExportFormat('json');
    }

    function handleExportSuccess() 
    {
        setExportingSetId(null);
        setExportFormat('json');
    }

    useImperativeHandle(ref, () => (
    {
        handleExportClick
    }));

    async function handleExportConfirm() 
    {
        if (!exportingSetId) return;

        try 
        {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/sets/${exportingSetId}/export?format=${exportFormat}`, {
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

            setExportFormat('json');
            handleExportSuccess();
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

    if (!exportingSetId) return null;

    return (
        <div className="export-modal">
            <div className="export-modal-content">
                <h3>{t('dashboard.export.title')}</h3>
                <p>{t('dashboard.export.chooseFormat')}</p>
                <div className="export-format-options">
                    <label>
                        <input 
                            type="radio" 
                            value="json" 
                            checked={exportFormat === 'json'} 
                            onChange={e => setExportFormat(e.target.value as 'json' | 'csv')}
                        />
                        {t('dashboard.export.jsonFormat')}
                    </label>
                    <label>
                        <input 
                            type="radio" 
                            value="csv" 
                            checked={exportFormat === 'csv'} 
                            onChange={e => setExportFormat(e.target.value as 'json' | 'csv')}
                        />
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
    );
});

DashboardExport.displayName = 'DashboardExport';

export default DashboardExport;
