import { useTranslation } from "react-i18next";
import type { DashboardImportModalProps } from '../../types and interfaces/interfaces.ts';

export default function DashboardImportModal(
{ 
    importFile, 
    importLoading, 
    onFileSelect, 
    onImportConfirm, 
    onImportCancel 
}: DashboardImportModalProps) {
    const { t } = useTranslation();

    return (
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
                    <input type="file" accept=".json,.csv" onChange={onFileSelect} className="import-file-input"/>
                    {importFile && (
                        <p className="selected-file">
                            {t('dashboard.import.selectedFile')} {importFile.name}
                        </p>
                    )}
                </div>

                <div className="import-modal-buttons">
                    <button onClick={onImportConfirm} className="import-confirm-btn" disabled={!importFile || importLoading}>
                        {importLoading ? t('dashboard.import.importing') : t('dashboard.import.importButton')}
                    </button>
                    <button onClick={onImportCancel} className="import-cancel-btn" disabled={importLoading}>
                        {t('dashboard.cancel')}
                    </button>
                </div>
            </div>
        </div>
    );
}
