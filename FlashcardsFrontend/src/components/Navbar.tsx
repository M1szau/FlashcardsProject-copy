import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { GB, PL, DE } from "country-flag-icons/react/3x2";
import { useAuth } from "../contexts";
import { AiOutlineMenu, AiOutlineClose } from "react-icons/ai";

export default function Navbar() 
{
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { logout } = useAuth();
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const languages = [
        { code: 'en', name: 'EN', flag: GB },
        { code: 'pl', name: 'PL', flag: PL },
        { code: 'de', name: 'DE', flag: DE }
    ];

    const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

    //logout button functionality
    function handleLogout() 
    {
        logout();
        setShowMobileMenu(false);
    }

    //language change functionality
    const handleLanguageChange = (languageCode: string) => 
    {
        i18n.changeLanguage(languageCode);
        localStorage.setItem('selectedLanguage', languageCode);
        setShowLanguageDropdown(false);
        setShowMobileMenu(false);
    }

    // Navigation with mobile menu close
    const handleNavigation = (path: string) => {
        navigate(path);
        setShowMobileMenu(false);
    };

    //close dropdown
    useEffect(() => 
    {
        function handleClickOutside(event: MouseEvent)
        {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) 
            {
                setShowLanguageDropdown(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Close mobile menu on window resize
    useEffect(() => 
    {
        const handleResize = () => 
        {
            if (window.innerWidth > 768) 
            {
                setShowMobileMenu(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
                    {t('navbar.appName')}
                </span>
                
                {/* Mobile Menu Button */}
                <button 
                    className="mobileMenuButton"
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    aria-label="Toggle mobile menu"
                >
                    {showMobileMenu ? <AiOutlineClose /> : <AiOutlineMenu />}
                </button>
            </div>
            
            {/* Desktop Navigation */}
            <div className="navbarRight">
                <button className="navButton" onClick={() => navigate('/learnForm')}>
                    {t('navbar.learn')}
                </button>
                <button className="navButton" onClick={() => navigate('/statistics')}>
                    {t('navbar.statistics')}
                </button>
                
                {/* Language Selector */}
                <div className="languageSelector" ref={dropdownRef}>
                    <button 
                        className="navButton languageButton"
                        onMouseEnter={() => setShowLanguageDropdown(true)}
                        onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                    >
                        <currentLanguage.flag className="flagIcon" />
                        <span className="languageName">{currentLanguage.name}</span>
                    </button>
                    
                    {showLanguageDropdown && (
                        <div 
                            className="languageDropdown"
                            onMouseLeave={() => setShowLanguageDropdown(false)}
                        >
                            {languages.map((language) => (
                                <button
                                    key={language.code}
                                    className={`languageOption ${language.code === i18n.language ? 'active' : ''}`}
                                    onClick={() => handleLanguageChange(language.code)}
                                >
                                    <language.flag className="flagIcon" />
                                    <span>{language.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                
                <button className="navButton" onClick={handleLogout}>
                    {t('navbar.logout')}
                </button>
            </div>

            {/* Mobile Navigation Menu */}
            {showMobileMenu && (
                <div className="mobileNav">
                    <button className="mobileNavButton" onClick={() => handleNavigation('/learnForm')}>
                        {t('navbar.learn')}
                    </button>
                    <button className="mobileNavButton" onClick={() => handleNavigation('/statistics')}>
                        {t('navbar.statistics')}
                    </button>
                    
                    {/* Mobile Language Options */}
                    <div className="mobileLanguageSection">
                        <span className="mobileLanguageLabel">{t('navbar.language')}:</span>
                        <div className="mobileLanguageOptions">
                            {languages.map((language) => (
                                <button
                                    key={language.code}
                                    className={`mobileLanguageButton ${language.code === i18n.language ? 'active' : ''}`}
                                    onClick={() => handleLanguageChange(language.code)}
                                >
                                    <language.flag className="flagIcon" />
                                    <span>{language.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <button className="mobileNavButton" onClick={handleLogout}>
                        {t('navbar.logout')}
                    </button>
                </div>
            )}
        </nav>
    );
}