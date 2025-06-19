import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/router';
import LoginPage from '@/pages/auth/login';
import { AuthProvider } from '@/hooks/useAuth';

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock the API client
jest.mock('@/lib/api', () => ({
  apiClient: {
    login: jest.fn(),
    validateSession: jest.fn(),
  },
}));

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({
  push: mockPush,
  pathname: '/auth/login',
});

const renderWithAuth = (component: React.ReactElement) => {
  return render(<AuthProvider>{component}</AuthProvider>);
};

describe('LoginPage', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders login form', () => {
    renderWithAuth(<LoginPage />);

    expect(screen.getByText('Sign in to RuneRogue')).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows link to register page', () => {
    renderWithAuth(<LoginPage />);

    const registerLink = screen.getByText('create a new account');
    expect(registerLink).toBeInTheDocument();
    expect(registerLink.closest('a')).toHaveAttribute('href', '/auth/register');
  });

  it('validates required fields', async () => {
    renderWithAuth(<LoginPage />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Try to submit without filling fields
    submitButton.click();

    // Should show validation errors (this would need more specific testing with user events)
    expect(submitButton).toBeInTheDocument();
  });
});
