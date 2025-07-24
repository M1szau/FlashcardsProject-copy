import { useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

interface RegisterProps 
{
    onSubmit: (regUsername: string, regPassword: string) => void
    error?: string;
}

export default function Register({ onSubmit, error }: RegisterProps) 
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
                    <label htmlFor='regUsername'>Choose your username</label>
                    <input id='regUsername' type='text' ref={usernameRef} />
                </p>
                <p>
                    <label htmlFor='regPassword'>Choose your password</label>
                    <input id='regPassword' type='password' ref={passwordRef} />
                    {error && <div className = 'error-box' style={{color: 'red', marginTop: '5px', fontSize: '14px'}}>{error}</div>}
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
    );
}