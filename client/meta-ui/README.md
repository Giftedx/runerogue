# RuneRogue Meta UI

A Next.js React application providing authentication, leaderboards, and account management for RuneRogue.

## Features

- User authentication (login/register)
- Dashboard with account overview
- Leaderboard display
- Account settings management
- Responsive design with Tailwind CSS
- TypeScript for type safety

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local with your API URL
```

3. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:e2e` - Run Playwright E2E tests

## Pages

- `/auth/login` - User login
- `/auth/register` - User registration
- `/dashboard` - Main dashboard
- `/leaderboard` - Player leaderboard
- `/settings` - Account settings

## Technologies

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Hook Form** - Form handling
- **Axios** - API client
- **Heroicons** - Icons
- **Jest** - Unit testing
- **Playwright** - E2E testing

## API Integration

The app connects to the authentication service at the URL specified in `NEXT_PUBLIC_API_URL`.

## Authentication Flow

1. User logs in via `/auth/login`
2. JWT tokens stored in secure cookies
3. Protected pages check authentication status
4. Automatic redirect to login if not authenticated

## Testing

Unit tests are located in `__tests__/` and use Jest with React Testing Library.

End-to-end tests use Playwright for full user journey testing.