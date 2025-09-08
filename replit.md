# Overview

This is a Korean clock application that provides accessible time-telling features with voice synthesis. The application displays time in both analog and digital formats, with Korean language support for number pronunciation and time calculations. It includes features for setting target times, calculating time differences, and voice announcements using the Web Speech API.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The application uses a modern React-based frontend stack with TypeScript for type safety. The architecture follows a component-based design pattern with clear separation of concerns:

- **Framework**: React with TypeScript and Vite for fast development and building
- **UI Library**: Radix UI components with shadcn/ui for consistent, accessible design
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: React hooks for local state, with custom hooks for speech synthesis and clock functionality
- **Routing**: Wouter for lightweight client-side routing

## Backend Architecture
The backend uses a minimalist Express.js server setup:

- **Server Framework**: Express.js with TypeScript
- **Storage Interface**: Abstract storage layer with in-memory implementation (MemStorage) for user data
- **Development Setup**: Vite integration for hot module replacement during development
- **Build Process**: ESBuild for production bundling

## Data Storage Solutions
The application uses a flexible storage architecture that can accommodate different database backends:

- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL as the primary database (configured via DATABASE_URL)
- **Current Implementation**: In-memory storage for development/testing
- **Schema**: User table with basic authentication fields (username, password)

## Authentication and Authorization
Basic user management structure is in place but not fully implemented:

- **User Model**: Defined with username and password fields
- **Storage Interface**: Methods for user creation and retrieval by ID or username
- **Session Management**: Configured with connect-pg-simple for PostgreSQL session storage

## External Dependencies

### Database and ORM
- **Neon Database**: Serverless PostgreSQL database (@neondatabase/serverless)
- **Drizzle ORM**: Type-safe ORM for database operations
- **Drizzle Kit**: CLI tools for database migrations and schema management

### UI and Styling
- **Radix UI**: Comprehensive set of accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Utility for creating variant-based component APIs

### Development and Build Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Static type checking
- **ESBuild**: Fast JavaScript bundler for production
- **PostCSS**: CSS processing with Tailwind CSS plugin

### Speech and Accessibility
- **Web Speech API**: Browser-native speech synthesis for Korean language support
- **Custom Speech Hooks**: Abstraction layer for speech functionality

### State Management and Data Fetching
- **TanStack React Query**: Server state management and caching
- **React Hook Form**: Form state management with validation
- **Zod**: Runtime type validation and schema definition

The application prioritizes accessibility with Korean language support, voice synthesis capabilities, and responsive design. The modular architecture allows for easy extension of features while maintaining clean separation between frontend and backend concerns.