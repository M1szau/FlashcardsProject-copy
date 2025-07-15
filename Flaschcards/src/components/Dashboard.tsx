import { useNavigate } from "react-router-dom";
import { useEffect, useState } from 'react';


export default function Dashboard ()
{
    //Logout functionality
    const navigate = useNavigate();
    const [sets, setSets] = useState<string[]>([]);

    //deleting token after logout
    useEffect(() =>
    {
        const token = localStorage.getItem('token');
        if (!token)
        {
            navigate('/login', {replace: true});
        }
    }, [navigate]);

    function handleLogout()
    {
        localStorage.removeItem('token');
        navigate('/login');
    }

    //Add new set functionality
    function handleAddSet()
    {
        setSets( prev => [...prev, `dummy block ${prev.length + 1}`]);
    }

    //4 sets per row
    const setsPerRow = 4;
    const firstRowSets = sets.slice(0, setsPerRow - 1);
    const remainingSets = sets.slice(setsPerRow - 1);

    const rows = [];
    for (let i=0; i < remainingSets.length; i += setsPerRow) 
    {
        rows.push(remainingSets.slice(i, i + setsPerRow))
    }

    return (
        //navbar for dashboard
        <main className='dashboardMain'>
            <nav className = 'dashboardNavbar'> 
                <div className = 'navbarLeft'>
                    <span className = 'logoDashboard' style =  {{cursor: 'pointer'}} onClick={ () => {                     
                    if (window.location.pathname === '/dashboard')
                        { window.location.reload(); }
                        else {navigate('/dashboard'); }
                    }}>Flashcards</span>
                </div>
                <div className = 'navbarRight'>
                    <button className = 'navButton' onClick = {() =>navigate('/statistics')}>Statistics</button>
                    <button className = 'navButton' onClick = {handleLogout}>Log out</button>
                </div>
            </nav>

            {/* Section with sets of flashcards*/}
            <section className='setsRow'>
                <div className = 'addSetBlock' onClick={handleAddSet}>
                    <span>+</span>
                    <p>Add new set</p>
                </div>
                {firstRowSets.map((set, i) => (
                    <div className = 'setBlock' key = {i}>{set}</div>
                ))}
            </section>

            { /* More blocks than 4 */}
            {rows.map((row, rowIndex) => (
                <section className = 'setsRow' key = {rowIndex +1}>
                    {row.map((set, i) => (
                        <div className = 'setBlock' key = {i}>{set}</div>
                    ))}
                </section>
            ))}
        </main>
    );
}