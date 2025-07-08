import { useRef, type FormEvent} from 'react';

type LogInProps = 
{
    onSubmit: (username: string, password: string) => void;
};



export default function LogIn({onSubmit}: LogInProps)
{
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    function handleSubmit(event: FormEvent<HTMLFormElement>)
    {
        event.preventDefault();

        const enteredUsername = usernameRef.current!.value;
        const enteredPassword = passwordRef.current!.value;
        
        event.currentTarget.reset();
        onSubmit(enteredUsername, enteredPassword);
    }

    return (
        <form onSubmit = {handleSubmit}>
            <p> 
                <label htmlFor= 'username'>Your username</label>
                <input id = 'username' type = 'text' ref = {usernameRef}/>
            </p>
            <p>
                <label htmlFor = 'password'>Your password</label>
                <input id = 'password' type='password' ref = {passwordRef}/>
            </p>
            <p>
                <button>Log in</button>
            </p>
        </form>
    );
}