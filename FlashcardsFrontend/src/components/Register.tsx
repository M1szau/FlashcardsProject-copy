import { useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Img from '../assets/logo.png';

export default function Register() 
{
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const [registerError, setRegisterError] = useState('');

    async function handleSubmit(event: FormEvent<HTMLFormElement>) 
    {
        event.preventDefault();

        const enteredUsername = usernameRef.current!.value;
        const enteredPassword = passwordRef.current!.value;
        const form = event.currentTarget; // Capture form reference before async operations

        setRegisterError('');
        
        try 
        {
            const response = await fetch('/api/register', 
            {
                method: 'POST', 
                headers: {'Content-Type': 'application/json'}, 
                body: JSON.stringify({ username: enteredUsername, password: enteredPassword })
            });
            
            const data = await response.json();
            if(data.success) 
            {
                localStorage.setItem('token', data.token);
                window.location.href = '/dashboard';
            } else {
                setRegisterError(data.message || 'Registration failed');
            }
        } catch (err) {
            setRegisterError('Registration failed');
        }

        form.reset(); // Use captured form reference
    }

    return (
        <main>
            <Header image={{ src: Img, alt: 'Registration sheet' }}>
                <h1>Please register</h1>
            </Header>
            <form onSubmit={handleSubmit}>
                <div>
                    <p>
                        <label htmlFor='regUsername'>Choose your username</label>
                        <input id='regUsername' type='text' ref={usernameRef} />
                    </p>
                    <p>
                        <label htmlFor='regPassword'>Choose your password</label>
                        <input id='regPassword' type='password' ref={passwordRef} />
                        {registerError && <div className = 'error-box' style={{color: 'red', marginTop: '5px', fontSize: '14px'}}>{registerError}</div>}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                        <div>
                            <button type="submit">Register</button>
                        </div>
                        <div>
                            <label htmlFor='register' style={{ marginRight: '0.5rem', marginTop: '1rem' }}>Already have an account?</label>
                            <button type="button" onClick={() => navigate('/')} style={{ whiteSpace: 'nowrap', marginTop: '0.5rem'}}>Log in</button>
                        </div>
                    </div>
                </div>
            </form>
        </main>
    );
}