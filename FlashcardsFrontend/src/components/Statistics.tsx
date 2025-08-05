
import Navbar from "./Navbar";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

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
    const { t } = useTranslation();

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
                    {t("statistics.loadingStatistics")}
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
                    {t("statistics.errorLoadingStatistics")}
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="statistics-container">
                <h1 className="statistics-title">{t("statistics.title")}</h1>

                <div className="statistics-overview">
                    <div className="stat-card">
                        <h3>{t("statistics.totalSets")}</h3>
                        <div className="stat-number">{statistics.totalSets}</div>
                    </div>
                    
                    <div className="stat-card">
                        <h3>{t("statistics.totalFlashcards")}</h3>
                        <div className="stat-number">{statistics.totalFlashcards}</div>
                    </div>
                    
                    <div className="stat-card known">
                        <h3>{t("statistics.knownCards")}</h3>
                        <div className="stat-number">{statistics.totalKnownCards}</div>
                    </div>
                    
                    <div className="stat-card unknown">
                        <h3>{t("statistics.notKnownYet")}</h3>
                        <div className="stat-number">{statistics.totalUnknownCards}</div>
                    </div>
                </div>

                <div className="learning-progress">
                    <h3>{t("statistics.learningProgress")}</h3>
                    <div className="progress-bar">
                        <div 
                            className="progress-fill" 
                            style= {{ width: `${statistics.totalFlashcards > 0 ? (statistics.totalKnownCards / statistics.totalFlashcards) * 100 : 0}%` } }
                        ></div>
                    </div>
                    <div className="progress-text">
                        {
                            statistics.totalFlashcards > 0 
                                ? `${Math.round((statistics.totalKnownCards / statistics.totalFlashcards) * 100)}% ${t("statistics.mastered")}`
                                : t("statistics.noFlashcardsYet")
                        }
                    </div>
                </div>

                <div className="sets-breakdown">
                    <h3>{t("statistics.breakdownBySets")}</h3>
                    {statistics.setStatistics.length === 0 ? 
                    (
                        <p>{t("statistics.noSetsCreated")}</p>
                    ) : (
                        <div className="sets-list">
                            {statistics.setStatistics.map((setStats) => 
                            (
                                <div key={setStats.setId} className="set-stat-card">
                                    <h4>{setStats.setName}</h4>
                                    <div className="set-stats">
                                        <span className="total-cards">
                                            {t("statistics.total")}: {setStats.totalCards}
                                        </span>
                                        <span className="known-cards">
                                            {t("statistics.known")}: {setStats.knownCards}
                                        </span>
                                        <span className="unknown-cards">
                                            {t("statistics.unknown")}: {setStats.unknownCards}
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
                                                ? `${Math.round((setStats.knownCards / setStats.totalCards) * 100)}% ${t("statistics.mastered")}`
                                                : t("statistics.noCardsInSet")
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