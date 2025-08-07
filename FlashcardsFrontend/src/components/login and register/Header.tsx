import type { HeaderProps } from '../../types and interfaces/types.ts';


export default function Header({image, children}: HeaderProps) 
{
    return (
        <header>
            <img {...image}/>
            {children}
        </header>
    )
}