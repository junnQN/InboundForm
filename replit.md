# Inbound Request Form

## Overview

This is a minimalist, multi-step form application for collecting inbound requests. The application features a conversational, Typeform-inspired user experience with a clean aesthetic. Users progress through three steps to provide their name, email, and additional information about their request. The form emphasizes radical simplicity with one question per screen, smooth animations, and a delightful user experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, using Vite as the build tool and development server.

**UI Component System**: Built on shadcn/ui components (Radix UI primitives) with extensive customization through the "new-york" style variant. The component library provides accessible, composable primitives for all UI elements including buttons, forms, dialogs, and more.

**Styling Approach**: 
- Tailwind CSS for utility-first styling with custom design tokens
- CSS variables for theming support (light/dark modes)
- Custom spacing primitives (2, 4, 6, 8, 12, 16, 20) for consistent rhythm
- Typography system using Inter font from Google Fonts with defined scale (32px questions, 20px inputs, 14px helpers)

**State Management**: 
- React hooks for local component state
- TanStack Query (React Query) for server state management
- Custom form state handling without external form libraries in the main form component

**Routing**: Wouter for lightweight client-side routing with routes for form (`/`), success (`/success`), and 404 pages.

**Animation**: Framer Motion for page transitions, component animations, and the conversational flow experience. Animations reinforce progress and provide spatial continuity between form steps.

**Form Design Principles**:
- One question per screen for radical simplicity
- Conversational flow mimicking dialogue
- Progressive disclosure to reduce cognitive load
- Vertical centering of questions for focus
- Max-width of 640px for optimal readability
- Bottom-anchored navigation controls

### Backend Architecture

**Runtime**: Node.js with Express.js framework for the HTTP server.

**API Design**: RESTful API with JSON endpoints:
- `POST /api/form-submissions` - Creates new form submission with validation
- `GET /api/form-submissions` - Retrieves all submissions (for potential admin view)

**Validation**: Zod schema validation integrated with Drizzle for type-safe data validation. Custom error messages for user-friendly feedback using `zod-validation-error`.

**Error Handling**: Centralized error handling with appropriate HTTP status codes (400 for validation errors, 500 for server errors).

**Development Features**:
- Request/response logging middleware for API routes
- Vite middleware integration for hot module replacement in development
- Development-only plugins (Replit cartographer, dev banner, runtime error overlay)

### Data Storage

**ORM**: Drizzle ORM for type-safe database interactions with PostgreSQL dialect.

**Database Driver**: Neon serverless PostgreSQL driver with WebSocket support for serverless environments.

**Schema Design**:
- `form_submissions` table with fields: id (UUID), name, email, additionalInfo, submittedAt (timestamp)
- `users` table (reference implementation, not actively used)
- Zod schemas derived from Drizzle schemas for validation consistency

**Migration Strategy**: Drizzle Kit for schema management with migrations stored in `/migrations` directory.

**Connection Management**: Connection pooling via Neon's Pool implementation, configured through `DATABASE_URL` environment variable.

### Authentication & Authorization

No authentication system is currently implemented. The users table exists as a reference implementation but is not integrated into the application flow. The form is publicly accessible.

### Build & Deployment

**Build Process**:
- Client: Vite bundles React application to `dist/public`
- Server: esbuild compiles TypeScript server code to `dist/index.js` with ESM format
- Production mode uses compiled artifacts, development uses tsx for on-the-fly TypeScript execution

**Module System**: ESM (ES Modules) throughout the application with `"type": "module"` in package.json.

**Path Aliases**: TypeScript path mapping for clean imports:
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets/*` → `attached_assets/*`

## External Dependencies

### Third-Party Services

**Database**: PostgreSQL database (expected to be provisioned via Neon or compatible service) accessed through `DATABASE_URL` environment variable.

### Key Libraries & Frameworks

**UI & Styling**:
- Radix UI - Accessible component primitives (accordion, dialog, dropdown, select, etc.)
- Tailwind CSS - Utility-first CSS framework
- class-variance-authority - Variant-based component styling
- framer-motion - Animation library

**Data & State Management**:
- TanStack Query - Server state management
- Drizzle ORM - Database ORM and query builder
- Zod - Schema validation and type inference

**Backend**:
- Express.js - Web framework
- Neon Serverless - PostgreSQL driver
- connect-pg-simple - PostgreSQL session store (imported but not actively used)

**Development Tools**:
- Vite - Build tool and dev server
- TypeScript - Type safety
- tsx - TypeScript execution for development
- esbuild - Production bundler for server code

**Fonts**: Google Fonts (Inter family) loaded via CDN in HTML.