import { useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

interface LogInProps 
{
    onSubmit: (username: string, password: string) => void;
    error?: string;
}

export default function LogIn({ onSubmit, error }: LogInProps) 
{
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    function handleSubmit(event: FormEvent<HTMLFormElement>) 
    {
        event.preventDefault();

        const enteredUsername = usernameRef.current!.value;
        const enteredPassword = passwordRef.current!.value;

        event.currentTarget.reset();
        onSubmit(enteredUsername, enteredPassword);
    }

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <p>
                    <label htmlFor='username'>Your username</label>
                    <input id='username' type='text' ref={usernameRef} />
                </p>
                <p>
                    <label htmlFor='password'>Your password</label>
                    <input id='password' type='password' ref={passwordRef} />
                    {error && <div className='error-box' style={{color: 'red', marginTop: '5px', fontSize: '14px'}}>{error}</div>}
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
    );
}