
import { Navigate, BrowserRouter, Routes, Route} from 'react-router-dom'


import Header from './components/Header.tsx';
import Img from './assets/logo.png';
import LogIn from './components/LogIn.tsx';
import Register from './components/Register.tsx'


export default function App()
{

    return (
        <BrowserRouter>
            <Routes>
                <Route path = "/" element = {<Navigate to ="/login" replace />} />
                <Route path="/login" element={
                    <main>
                        <Header image={{ src: Img, alt: 'Log in sheet' }}>
                            <h1>Please log in</h1>
                        </Header>
                        <LogIn onSubmit={(username, password) => {
                            console.log('Form submitted with data: ', { username, password }, '. Right now no connection with database');
                        }} />
                    </main>
                } />
                <Route path="/register" element={
                    <main>
                        <Header image={{ src: Img, alt: 'Log in sheet' }}>
                            <h1>Please register yourself</h1>
                        </Header>
                        <Register onSubmit={(username, password) => 
                        {
                            console.log('Form registered new user with data: ', {username, password}, '. Right now no connection with database');
                        }}/>
                    </main>
                } />
            </Routes>
        </BrowserRouter>
    );
}