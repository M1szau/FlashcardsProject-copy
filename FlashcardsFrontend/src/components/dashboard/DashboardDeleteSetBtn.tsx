import { forwardRef, useImperativeHandle } from 'react';
import { AiFillDelete } from "react-icons/ai";
import { useTranslation } from "react-i18next";
import type { DashboardDeleteSetBtnProps, DashboardDeleteSetBtnRef } from '../../types and interfaces/interfaces.ts';

const DashboardDeleteSetBtn = forwardRef<DashboardDeleteSetBtnRef, DashboardDeleteSetBtnProps>((props, ref) => 
{
    const { set, setIndex, onDeleteSuccess } = props;
    const { t } = useTranslation();

    const handleDeleteSet = async (idx: number) => 
    {
        if (window.confirm(t('dashboard.deleteSet'))) 
        {
            const token = localStorage.getItem('token');
            await fetch(`/api/sets/${set.id}`, 
            {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            onDeleteSuccess(idx);
        }
    };

    useImperativeHandle(ref, () => (
    {
        handleDeleteSet: () => handleDeleteSet(setIndex)
    }));

    return (
        <button 
            className="setDeleteBtn" 
            title={t('dashboard.deleteSet')} 
            onClick={e => 
            { 
                e.stopPropagation(); 
                handleDeleteSet(setIndex); 
            }}
        >
            <span><AiFillDelete /></span>
        </button>
    );
});

DashboardDeleteSetBtn.displayName = 'DashboardDeleteSetBtn';

export default DashboardDeleteSetBtn;
