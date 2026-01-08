# PolyTrade - Prediction Market Simulator

## Overview

PolyTrade is a paper trading application for prediction markets. Users can practice trading on real-world events using a $10,000 virtual starting balance. The application provides market trading, limit orders, stop-loss orders, portfolio tracking, and profit/loss calculations without any real money risk.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite with custom configuration
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query for server state, custom hooks for local state
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom theme variables and dark mode support

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful endpoints under `/api/*`
- **Build Process**: esbuild for production bundling with dependency allowlisting for cold start optimization

### Authentication
- **Provider**: Replit Auth via OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **Middleware**: Custom `isAuthenticated` middleware for protected routes

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with Zod schema validation
- **Schema Location**: `shared/schema.ts` and `shared/models/auth.ts`
- **Key Tables**:
  - `users`: User accounts with balance and settings
  - `positions`: User market positions
  - `trades`: Trade history
  - `limit_orders`: Pending limit orders
  - `stop_loss_orders`: Active stop-loss orders
  - `notifications`: User notifications
  - `sessions`: Auth session storage

### Project Structure
```
client/          # React frontend application
  src/
    components/  # UI components including shadcn/ui
    pages/       # Route page components
    hooks/       # Custom React hooks
    lib/         # Utilities, API client, store
server/          # Express backend
  replit_integrations/auth/  # Replit Auth integration
shared/          # Shared types and database schema
  models/        # Auth-related models
  schema.ts      # Drizzle table definitions
```

### API Design
- Protected routes require Replit Auth authentication
- User profile, positions, trades, orders, and notifications have dedicated endpoints
- Trading operations (buy, sell, limit orders, stop-losses) are handled via POST/PATCH endpoints

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Drizzle Kit**: Database migrations stored in `/migrations`

### Authentication
- **Replit Auth**: OpenID Connect provider for user authentication
- **Required Environment Variables**: `ISSUER_URL`, `REPL_ID`, `SESSION_SECRET`, `DATABASE_URL`

### Third-Party Services
- **Polymarket API**: Mock data currently used; designed to integrate with real Polymarket data for live market prices

### Key npm Dependencies
- `drizzle-orm` / `drizzle-zod`: Database ORM and validation
- `@tanstack/react-query`: Data fetching and caching
- `passport` / `openid-client`: Authentication
- `express-session` / `connect-pg-simple`: Session management
- `recharts`: Chart visualization for market data