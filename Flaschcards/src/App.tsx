
import { Navigate, BrowserRouter, Routes, Route} from 'react-router-dom'
import { useState } from 'react';

import Header from './components/Header.tsx';
import Img from './assets/logo.png';
import LogIn from './components/LogIn.tsx';
import Register from './components/Register.tsx'


export default function App()
{
    //setting errors for login and register
    const [loginError, setLoginError] = useState('');
    const [registerError, setRegisterError] = useState('');

    return (
        <BrowserRouter>
            <Routes>
                <Route path = "/" element = {<Navigate to ="/login" replace />} />
                <Route path="/login" element=
                {
                    <main>
                        <Header image={{ src: Img, alt: 'Log in sheet' }}>
                            <h1>Please log in</h1>
                        </Header>
                        <LogIn onSubmit={ async (username, password) => 
                        {
                            setLoginError('');
                            //Login functionality 
                            try
                            {
                                const response = await fetch('/api/login', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ username, password })});
                                
                                const data = await response.json();
                                if(data.success)
                                {
                                    localStorage.setItem('token', data.token);
                                    window.location.href = '/dashboard'; 
                                }
                                else
                                {
                                    setLoginError(data.message || 'Login failed');
                                }
                            } catch (err) 
                            {
                                setLoginError('Login failed');
                            }
                        }}
                        error = {loginError} />
                    </main>
                } />
                <Route path="/register" element=
                {
                    <main>
                        <Header image={{ src: Img, alt: 'Log in sheet' }}>
                            <h1>Please register yourself</h1>
                        </Header>
                        <Register onSubmit={async (username, password) => 
                        {
                            setRegisterError('');
                            //Register functionality
                            try
                            {
                                const response = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });

                                const data = await response.json();
                                if(data.success)
                                {
                                    alert('Registration successful');
                                    window.location.href = '/login'; // Redirect to login page after successful registration
                                    
                                }
                                else
                                {
                                    setRegisterError(data.message || 'Registration failed');
                                }
                            } catch (err)
                            {
                                setRegisterError('Registration failed');
                            }
                        }}
                        error = {registerError}
                        />
                    </main>
                } />
                
                <Route path="/dashboard" element=
                {
                    <main className='dashboardMain'>
                        There will be a dashboard
                    </main>
                }> 
                
                </Route>
            </Routes>
        </BrowserRouter>
    );
}