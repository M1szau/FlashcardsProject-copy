
import { Navigate, BrowserRouter, Routes, Route} from 'react-router-dom'

import LogIn from './components/login and register/LogIn.tsx';
import Register from './components/login and register/Register.tsx'
import Dashboard from './components/dashboard/Dashboard.tsx';
import Statistics from './components/Statistics.tsx';
import Flashcards from './components/flashcards/Flashcards.tsx';
import LearnForm from './components/LearnForm.tsx';
import FlashcardLearning from './components/FlashcardLearning.tsx';
import { AuthProvider, SetsProvider, FlashcardsProvider } from './contexts';

export default function App()
{
    return (
        <BrowserRouter>
            <AuthProvider>
                <SetsProvider>
                    <FlashcardsProvider>
                        <Routes>
                            {/*Routes to login and register form*/}
                            <Route path = "/" element = {<Navigate to ="/login" replace />} />
                            <Route path="/login" element={<LogIn />} />
                            <Route path="/register" element={<Register />} />
                            
                            {/*Routes to components*/}
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/statistics" element={<Statistics />} />
                            <Route path='/set/:setId' element={<Flashcards />} />
                            <Route path='/learnForm' element={<LearnForm />} />
                            <Route path='/learn/practice/:setId' element={<FlashcardLearning />} />
                        </Routes>
                    </FlashcardsProvider>
                </SetsProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}