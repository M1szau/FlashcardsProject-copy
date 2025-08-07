import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import Header from '../../components/login and register/Header.tsx';
import { MemoryRouter } from 'react-router-dom';

describe('Header component', () =>
{
    it('Renders image and children', () =>
    {
        render(
            <MemoryRouter>
                <Header image = {{src: 'test.png', alt: 'Test image'}}>
                    <h1>Test Header</h1>
                </Header>
            </MemoryRouter>
        )

        //Image check
        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('src', 'test.png');
        expect(img).toHaveAttribute('alt', 'Test image');

        //Children check
        expect(screen.getByText(/Test Header/i)).toBeInTheDocument();
    });
});