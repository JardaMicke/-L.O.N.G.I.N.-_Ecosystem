import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

// Mock the components that are lazy loaded
jest.mock('../pages/CharactersPage', () => () => <div data-testid="characters-page">Characters Page</div>);
jest.mock('../pages/ChatPage', () => () => <div data-testid="chat-page">Chat Page</div>);
jest.mock('../pages/SettingsPage', () => () => <div data-testid="settings-page">Settings Page</div>);
jest.mock('../pages/RolePlayingPage', () => () => <div data-testid="role-playing-page">Role Playing Page</div>);

// Mock other components
jest.mock('../components/Header', () => () => <header data-testid="header">Header</header>);
jest.mock('../components/Sidebar', () => () => <div data-testid="sidebar">Sidebar</div>);
jest.mock('../utils/PerformanceMonitor', () => ({
  init: jest.fn(),
  stop: jest.fn(),
  getMetrics: jest.fn().mockReturnValue({ loadTime: 1000 })
}));

// Mock useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: jest.fn(({ to }) => <div data-testid="navigate">Navigate to {to}</div>),
  useNavigate: () => jest.fn(),
}));

describe('App Component', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  test('renders main app structure', async () => {
    // Mock Suspense by replacing with synchronous component
    jest.mock('react', () => ({
      ...jest.requireActual('react'),
      Suspense: ({ children }) => children,
    }));

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Check for main components
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('navigate')).toBeInTheDocument();
  });
});