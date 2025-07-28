
import Navbar from "./Navbar";
import { useEffect, useState } from "react";

type SetStatistics = 
{
    setId: string;
    setName: string;
    totalCards: number;
    knownCards: number;
    unknownCards: number;
};

type Statistics = 
{
    totalSets: number;
    totalFlashcards: number;
    totalKnownCards: number;
    totalUnknownCards: number;
    setStatistics: SetStatistics[];
};

export default function Statistics()
{
    const [statistics, setStatistics] = useState<Statistics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => 
    {
        const token = localStorage.getItem('token');
        
        fetch('/api/statistics', 
        {
            headers: 
            {
                Authorization: `Bearer ${token}`
            }
        })
        .then(res => 
        {
            if (!res.ok) 
            {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => 
        {
            setStatistics(data);
            setLoading(false);
        })
        .catch(error => 
        {
            console.error('Error fetching statistics:', error);
            setLoading(false);
        });
    }, []);

    if (loading) 
    {
        return (
            <>
                <Navbar />
                <div style={{ textAlign: "center", margin: "2rem", color: "#8F00BF" }}>
                    Loading statistics...
                </div>
            </>
        );
    }

    if (!statistics) 
        {
        return (
            <>
                <Navbar />
                <div style={{ textAlign: "center", margin: "2rem", color: "#8F00BF" }}>
                    Error loading statistics.
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="statistics-container">
                <h1 className="statistics-title">Learning Statistics</h1>
                
                <div className="statistics-overview">
                    <div className="stat-card">
                        <h3>Total Sets</h3>
                        <div className="stat-number">{statistics.totalSets}</div>
                    </div>
                    
                    <div className="stat-card">
                        <h3>Total Flashcards</h3>
                        <div className="stat-number">{statistics.totalFlashcards}</div>
                    </div>
                    
                    <div className="stat-card known">
                        <h3>Known Cards</h3>
                        <div className="stat-number">{statistics.totalKnownCards}</div>
                    </div>
                    
                    <div className="stat-card unknown">
                        <h3>Not Known Yet</h3>
                        <div className="stat-number">{statistics.totalUnknownCards}</div>
                    </div>
                </div>

                <div className="learning-progress">
                    <h3>Learning Progress</h3>
                    <div className="progress-bar">
                        <div 
                            className="progress-fill" 
                            style= {{ width: `${statistics.totalFlashcards > 0 ? (statistics.totalKnownCards / statistics.totalFlashcards) * 100 : 0}%` } }
                        ></div>
                    </div>
                    <div className="progress-text">
                        {
                            statistics.totalFlashcards > 0 
                                ? `${Math.round((statistics.totalKnownCards / statistics.totalFlashcards) * 100)}% mastered`
                                : 'No flashcards yet'
                        }
                    </div>
                </div>

                <div className="sets-breakdown">
                    <h3>Breakdown by sets</h3>
                    {statistics.setStatistics.length === 0 ? 
                    (
                        <p>No sets created yet.</p>
                    ) : (
                        <div className="sets-list">
                            {statistics.setStatistics.map((setStats) => 
                            (
                                <div key={setStats.setId} className="set-stat-card">
                                    <h4>{setStats.setName}</h4>
                                    <div className="set-stats">
                                        <span className="total-cards">
                                            Total: {setStats.totalCards}
                                        </span>
                                        <span className="known-cards">
                                            Known: {setStats.knownCards}
                                        </span>
                                        <span className="unknown-cards">
                                            Unknown: {setStats.unknownCards}
                                        </span>
                                    </div>
                                    <div className="set-progress-bar">
                                        <div 
                                            className="set-progress-fill" 
                                            style={
                                            { 
                                                width: `${setStats.totalCards > 0 ? (setStats.knownCards / setStats.totalCards) * 100 : 0}%` 
                                            }}
                                        ></div>
                                    </div>
                                    <div className="set-progress-text">
                                        {
                                            setStats.totalCards > 0 
                                                ? `${Math.round((setStats.knownCards / setStats.totalCards) * 100)}% mastered`
                                                : 'No cards in this set'
                                        }
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}