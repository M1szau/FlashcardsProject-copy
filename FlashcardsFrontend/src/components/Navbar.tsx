import { useNavigate } from "react-router-dom";

export default function Navbar() 
{
    const navigate = useNavigate();

    //logout button functionality
    function handleLogout() 
    {
        localStorage.removeItem('token');
        navigate('/login');
    }

    return (
        <nav className="dashboardNavbar">
            <div className="navbarLeft">
                <span
                    className="logoDashboard"
                    style={{ cursor: 'pointer' }}
                    onClick={() => 
                    {
                        if (window.location.pathname === '/dashboard') 
                        {
                            window.location.reload();
                        } else {
                            navigate('/dashboard');
                        }
                    }}
                >
                    Flashcards
                </span>
            </div>
            <div className="navbarRight">
                <button className="navButton" onClick={() => navigate('/learnForm')}>Learn</button>
                <button className="navButton" onClick={() => navigate('/statistics')}>Statistics</button>
                <button className="navButton" onClick={handleLogout}>Log out</button>
            </div>
        </nav>
    );
}