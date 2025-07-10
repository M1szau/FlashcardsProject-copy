
import { Navigate, BrowserRouter, Routes, Route} from 'react-router-dom'
import { useState } from 'react'

import Header from './components/Header.tsx';
import Img from './assets/logo.png';
import LogIn from './components/LogIn.tsx';
import Register from './components/Register.tsx'


export default function App()
{
    const [loginError, setLoginError] = useState('');
    const [registerError, setRegisterError] = useState('');

    return (
        <BrowserRouter>
            <Routes>
                <Route path = "/" element = {<Navigate to ="/login" replace />} />
                <Route path="/login" element={
                    <main>
                        <Header image={{ src: Img, alt: 'Log in sheet' }}>
                            <h1>Please log in</h1>
                        </Header>
                        <LogIn 
                            error={loginError}
                            onSubmit={ async (username, password) => 
                            {
                                //Login functionality 
                                setLoginError(''); 
                                try
                                {
                                    const response = await fetch('http://localhost:3001/api/login', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ username, password })});
                                    
                                    const data = await response.json();
                                    if(data.success)
                                    {
                                        localStorage.setItem('token', data.token);
                                        alert('Login successful');
                                    }
                                    else
                                    {
                                        setLoginError(data.message);
                                    }
                                } catch (err) 
                                {
                                    setLoginError('Login failed. Please try again.');
                                }
                            }} />
                    </main>
                } />
                <Route path="/register" element={
                    <main>
                        <Header image={{ src: Img, alt: 'Log in sheet' }}>
                            <h1>Please register yourself</h1>
                        </Header>
                        <Register 
                        error = {registerError}
                        onSubmit={async (username, password) => 
                        {
                            //Register functionality
                            setRegisterError('');
                            try 
                            {
                                const response = await fetch('http://localhost:3001/api/register', { method: 'POST',headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password })});
                                const data = await response.json();
                                if (data.success) 
                                {
                                    alert('Registration successful Please log in now.');
                                    window.location.href = '/login';
                                } 
                                else {
                                    setRegisterError(data.message);
                                }
                            } catch (err) 
                            {
                                setRegisterError('Registration failed.');
                            }
                        }}/>
                    </main>
                } />
            </Routes>
        </BrowserRouter>
    );
}