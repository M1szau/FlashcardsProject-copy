import { useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts';
import Header from './Header';
import Img from '../../assets/logo.png';

export default function LogIn() 
{
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const { login } = useAuth();
    const [loginError, setLoginError] = useState('');

    async function handleSubmit(event: FormEvent<HTMLFormElement>) 
    {
        event.preventDefault();

        const enteredUsername = usernameRef.current!.value;
        const enteredPassword = passwordRef.current!.value;
        const form = event.currentTarget;

        setLoginError('');
        
        try 
        {
            const response = await fetch('/api/login', 
            {
                method: 'POST', 
                headers: {'Content-Type': 'application/json'}, 
                body: JSON.stringify({ username: enteredUsername, password: enteredPassword })
            });
            
            const data = await response.json();
            if(data.success) 
            {
                login(data.token, data.user);
                navigate('/dashboard');
            } else {
                setLoginError(data.message || 'Login failed');
            }
        } catch (err) {
            setLoginError('Login failed');
        }

        form.reset();
    }

    return (
        <main>
            <Header image={{ src: Img, alt: 'Log in sheet' }}>
                <h1>Please log in</h1>
            </Header>
            <form onSubmit={handleSubmit}>
                <div>
                    <p>
                        <label htmlFor='username'>Your username</label>
                        <input id='username' type='text' ref={usernameRef} />
                    </p>
                    <p>
                        <label htmlFor='password'>Your password</label>
                        <input id='password' type='password' ref={passwordRef} />
                        {loginError && <div className='error-box' style={{color: 'red', marginTop: '5px', fontSize: '14px'}}>{loginError}</div>}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                        <div>
                            <button type="submit">Log in</button>
                        </div>
                        <div>
                            <label htmlFor='register' style={{ marginRight: '0.5rem', marginTop: '1rem' }}>Not yet with us?</label>
                            <button type="button" onClick={() => navigate('/register')} style={{ whiteSpace: 'nowrap', marginTop: '0.5rem'}}>Join us!</button>
                        </div>
                    </div>
                </div>
            </form>
        </main>
    );
}