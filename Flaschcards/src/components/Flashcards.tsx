import Navbar from "./Navbar";
import { useEffect } from "react";


export default function App()
{
    useEffect(() =>
    {
        //Preventing from leaving, reloading or closing the page 
        const handleBeforeUnload = (e: BeforeUnloadEvent) =>
            {
                e.preventDefault();
                e.returnValue = ''; //for Chrome
            };
            window.addEventListener('beforeunload', handleBeforeUnload);

            return () => 
            {
                window.removeEventListener('beforeunload', handleBeforeUnload);
            }
    }, []);
    return (
        <>
            <Navbar />
            <div>There will be flashcards here</div>
        </>
    );
}