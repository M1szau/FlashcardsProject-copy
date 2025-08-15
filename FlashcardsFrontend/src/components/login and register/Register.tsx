import { API_BASE_URL } from "../../apiBaseUrl";
import { useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts';
import Header from './Header';
import Img from '../../assets/logo.png';

export default function Register() 
{
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const { login } = useAuth();
    const [registerError, setRegisterError] = useState('');

    async function handleSubmit(event: FormEvent<HTMLFormElement>) 
    {
        event.preventDefault();

        const enteredUsername = usernameRef.current!.value;
        const enteredPassword = passwordRef.current!.value;
        const form = event.currentTarget;

        setRegisterError('');
        
        try 
        {
            const response = await fetch(`${API_BASE_URL}/api/register`, 
            {
                method: 'POST', 
                headers: {'Content-Type': 'application/json'}, 
                body: JSON.stringify({ username: enteredUsername, password: enteredPassword })
            });
            
            const data = await response.json();
            if(data.success) 
            {
                login(data.token, { username: enteredUsername });
                navigate('/dashboard');
            } else {
                setRegisterError(data.message || 'Registration failed');
            }
        } catch (err) {
            setRegisterError('Registration failed');
        }

        form.reset();
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1rem', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <button type="submit" style={{ minWidth: '120px', padding: '0.75rem 1.5rem' }}>Register</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <label htmlFor='register' style={{ marginTop: '1rem', marginBottom: '-2rem', textAlign: 'center', fontWeight: 'bold', color: '#dfd9be', fontSize: '0.95rem', textTransform: 'uppercase' }}>Already have an account?</label>
                            <button type="button" onClick={() => navigate('/')} style={{ minWidth: '120px', padding: '0.75rem 1.5rem' }}>Log in</button>
                        </div>
                    </div>
                </div>
            </form>
        </main>
    );
}