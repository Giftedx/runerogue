const { render, screen } = require('@testing-library/react');
const App = require('../App'); // Adjust the path as necessary

test('renders hello world', () => {
    render(<App />);
    const linkElement = screen.getByText(/hello world/i);
    expect(linkElement).toBeInTheDocument();
});