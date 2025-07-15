import { useNavigate } from "react-router-dom";

export default function Dashboard ()
{
    //Logout functionality
    const navigate = useNavigate();

    function handleLogout()
    {
        localStorage.removeItem('token');
        navigate('/login');
    }


    return (
        //nabar for dashboard
        <main className='dashboardMain'>
            <nav className = 'dashboardNavbar'> 
                <div className = 'navbarLeft'>
                    <span className = 'logoDashboard'>Flashcards</span>
                    <button className = 'navButton'>Statistics</button>
                </div>
                <div className = 'navbarRight'>
                    <select className = 'languageSelect' defaultValue='en'>
                        <option value='en'>English</option>
                        <option value='pl'>Polish</option>
                        <option value='de'>German</option>
                    </select>
                    <button className = 'navButton' onClick={handleLogout}>Log out</button>
                </div>
            </nav>
        </main>
    );
}