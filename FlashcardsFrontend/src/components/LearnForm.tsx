import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import type { SetType } from "../types/flashcard.ts"; 


export default function LearnForm()
{
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
                const res = await fetch('/api/sets',
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
            alert('Please select a set to learn from.');
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
                <div style = { {position: 'static', transform: 'none'}}>Loading your sets...</div>
            </>
        )
    }

    return(
        <>
            <Navbar />
            <div className = 'flashcard-center'>
                <div className = 'flashcard-add-modal' style = { {position: 'static', transform: 'none', background: 'transparent'}}>
                    <form className="flashcard-add-form" onSubmit={handleSubmit}>
                        <h2>Choose set to learn</h2>
                        {/*Choice of set*/}
                        <label>
                            Select set
                            <select
                            value = {selectedSetId}
                            onChange = {(e) => setSelectedSetId(e.target.value)}
                            className="flashcard-edit-input"
                            required
                            >
                                <option value = "" disabled> Choose a set to practice </option>
                                {Array.isArray(sets) && sets.map(set => ( <option key = {set.id} value = {set.id}> {set.name}</option>))}
                            </select>
                        </label>
                        {/*Choice of learning mode*/}
                        <label>
                            Learning Mode
                            <select
                            value = {learnMode}
                            onChange = {(e) => setLearnMode(e.target.value)}
                            className="flashcard-edit-input"
                            required
                            >
                                <option value = "all">Practice all flashcards </option>
                                <option value = "unknown">Practice only unknown flashcards </option>
                            </select>
                        </label>

                        {sets.length === 0 && (< div style = { { textAlign: 'center', color: '#8F00BF', marginTop: '1rem', fontStyle: 'italic'} }>You don't have any sets yet. Please create one in Dashboard.</div>)}

                        <div className = 'flashcard-actions-bottom' style = { {justifyContent: 'flex-end'}}>
                            <button className = 'flashcard-add-save-button' type = 'submit' disabled = {sets.length === 0 } aria-label = 'Start Learning'>
                                Start Learning
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}