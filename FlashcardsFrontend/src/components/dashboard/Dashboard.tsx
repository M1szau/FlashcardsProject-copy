import { useRef } from 'react';
import { useTranslation } from "react-i18next";
import { useSets } from '../../contexts';

import Navbar from '../Navbar.tsx';
import DashboardImport from './DashboardImport.tsx';
import DashboardExport from './DashboardExport.tsx';
import DashboardAddNewSet from './DashboardAddNewSet.tsx';
import DashboardSetBlock from './DashboardSetBlock.tsx';
import type { DashboardExportRef, DashboardImportRef, DashboardAddNewSetRef } from '../../types and interfaces/interfaces.ts';

export default function Dashboard() 
{
    const { t } = useTranslation();
    const { sets, actions: setsActions } = useSets();

    const exportRef = useRef<DashboardExportRef>(null);
    const importRef = useRef<DashboardImportRef>(null);
    const addNewSetRef = useRef<DashboardAddNewSetRef>(null);

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

    //Blocks functionality
    const allBlocks = [];
    
    //Add the DashboardAddNewSet component
    allBlocks.push(
        <DashboardAddNewSet
            key="add-new-set"
            ref={addNewSetRef}
            onAddSuccess={setsActions.add}
            onImportClick={() => importRef.current?.handleImportClick()}
        />
    );
    
    if (Array.isArray(sets)) 
    {
        sets.forEach((set, i) => 
        {
            //Skip invalid set objects
            if (!set || typeof set !== 'object' || !set.id || !set.name) 
            {
                return;
            }
            
            allBlocks.push(
                <DashboardSetBlock
                    key={set.id}
                    set={set}
                    setIndex={i}
                    onEditSuccess={setsActions.update}
                    onDeleteSuccess={setsActions.remove}
                    onExportClick={(setId) => exportRef.current?.handleExportClick(setId)}
                    getLanguageName={getLanguageName}
                    truncateText={truncateText}
                />
            );
        });
    } //end if Array.isArray(sets)

    //Show message when no sets exist
    if (Array.isArray(sets) && sets.length === 0) 
    {
        allBlocks.push(
            <div key="no-sets" className="no-sets-message">
                <p>{t('dashboard.noSetsFound')}</p>
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
            <DashboardExport ref={exportRef} sets={sets} />

            {/* Import Modal */}
            <DashboardImport ref={importRef} onImportSuccess={setsActions.add}/>
        </main>
    );
}