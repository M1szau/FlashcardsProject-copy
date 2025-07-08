
import Header from './components/Header.tsx';
import Img from './assets/logo.png';
import LogIn from './components/LogIn.tsx';

export default function App()
{

    

    return (
        <main>
            <Header image = {{src: Img, alt: 'Log in sheet'}}>
            <h1>Please log in</h1>
            </Header>
            <LogIn onSubmit = {(username, password) => 
                {console.log('Form submitted with data: ', {username, password}, '. Right now no connection with database')}} />
        </main>
    )
}