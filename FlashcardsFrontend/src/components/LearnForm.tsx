import { API_BASE_URL } from "../apiBaseUrl";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import type { SetType } from "../types and interfaces/types.ts";
import { useTranslation } from "react-i18next";

export default function LearnForm()
{
    const { t } = useTranslation();

    const navigate = useNavigate();
    const [sets, setSets] = useState<SetType[]>([]);
    const [selectedSetId, setSelectedSetId] = useState('');
    const [learnMode, setLearnMode] = useState('all');
    const [loading, setLoading] = useState(true);

    //Token
    useEffect(() => 
    {
        const token = localStorage.getItem('token');
        if(!token)
        {
            navigate('/login', { replace: true });
            return;
        }

        async function fetchSets()
        {
            try
            {
                const res = await fetch(`${API_BASE_URL}/api/sets`,
                    {
                        headers: 
                        {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                if(!res.ok)
                {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }

                const data = await res.json();
                //Sets array from the response object
                const setsArray = data.sets || data || [];
                setSets(Array.isArray(setsArray) ? setsArray : []);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching sets:', error);
                setSets([]);
                setLoading(false);
            }
        }
        fetchSets();
    }, [navigate]);

    //Submitting the form
    const handleSubmit = (e: React.FormEvent) =>
    {
        e.preventDefault();

        if(!selectedSetId.trim())
        {
            alert(t('learnForm.selectSetError'));
            return;
        }

        //Navigation to learn page
        const params = new URLSearchParams(
            {
                mode: learnMode
            }
        );

        navigate(`/learn/practice/${selectedSetId}?${params.toString()}`);
    }

    if(loading)
    {
        return(
            <>
                <Navbar />
                <div style = { {position: 'static', transform: 'none'}}>{t("learnForm.loadingSets")}</div>
            </>
        )
    }

    return(
        <>
            <Navbar />
            <div className = 'flashcard-center'>
                <div className = 'flashcard-add-modal' style = { {position: 'static', transform: 'none', background: 'transparent'}}>
                    <form className="flashcard-add-form" onSubmit={handleSubmit}>
                        <h2>{t("learnForm.title")}</h2>
                        {/*Choice of set*/}
                        <label>
                            {t("learnForm.selectSet")}
                            <select
                            value = {selectedSetId}
                            onChange = {(e) => setSelectedSetId(e.target.value)}
                            className="flashcard-edit-input"
                            required
                            >
                                <option value = "" disabled> {t("learnForm.chooseSetPlaceholder")} </option>
                                {Array.isArray(sets) && sets.map(set => ( <option key = {set.id} value = {set.id}> {set.name}</option>))}
                            </select>
                        </label>
                        {/*Choice of learning mode*/}
                        <label>
                            {t("learnForm.learningMode")}
                            <select
                            value = {learnMode}
                            onChange = {(e) => setLearnMode(e.target.value)}
                            className="flashcard-edit-input"
                            required
                            >
                                <option value = "all">{t("learnForm.practiceAll")}</option>
                                <option value = "unknown">{t("learnForm.practiceUnknown")}</option>
                            </select>
                        </label>

                        {sets.length === 0 && (< div style = { { textAlign: 'center', color: '#8F00BF', marginTop: '1rem', fontStyle: 'italic'} }>{t("learnForm.noSetsMessage")}</div>)}

                        <div className = 'flashcard-actions-bottom' style = { {justifyContent: 'flex-end'}}>
                            <button className = 'flashcard-add-save-button' type = 'submit' disabled = {sets.length === 0 } aria-label = 'Start Learning'>
                                {t("learnForm.startLearning")}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}