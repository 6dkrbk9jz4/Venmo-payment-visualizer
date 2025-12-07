# Transaction Flow Visualizer

## Overview

The Transaction Flow Visualizer is a browser-based application that enables users to upload CSV files containing transaction data (with To, From, and Amount columns) and visualize money flows between people using interactive Sankey diagrams. Originally designed for Venmo statements, it now supports any generic CSV format with flexible column mapping. The application processes all data client-side without requiring a backend server, providing privacy and instant analysis of financial transactions.

Key features include:
- Multi-file CSV upload and parsing (supports Venmo and generic CSV formats)
- Flexible column auto-detection (To/From/Amount with many variations)
- Interactive Sankey diagram visualization showing money flows between individuals
- Color-coded flows: green for received money, red for sent money
- Superhero avatar system for visual person identification
- Filterable transaction table with sorting and pagination
- Summary statistics and analytics
- Alias mapping for consolidating person names
- Date range filtering
- Session persistence with localStorage
- Merchant filtering and clustering capability
- Export functionality (CSV, JSON, PNG)
- Dark/light theme support
- Fully client-side processing for data privacy

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite as the build tool and development server.

**Routing**: Wouter (lightweight client-side routing) - currently single-page with home and 404 routes.

**State Management**: React hooks (useState, useMemo, useCallback) for local component state. No global state management library is used, keeping the architecture simple since all data processing happens in-browser.

**UI Component Library**: Shadcn UI (Radix UI primitives) with Tailwind CSS for styling. The design follows Carbon Design System principles for data-intensive applications, using IBM Plex Sans and IBM Plex Mono fonts.

**Data Visualization**: D3.js with d3-sankey for creating interactive flow diagrams showing transaction relationships between people.

**CSV Parsing**: PapaParse library handles CSV file parsing with robust error handling and format detection.

### Client-Side Data Processing

All transaction processing occurs in the browser:

1. **File Upload**: FileReader API reads CSV files without server transmission
2. **Parsing**: CSV data is normalized into a common Transaction schema using Zod validation
3. **Aggregation**: Transactions are grouped and aggregated to calculate flows between individuals
4. **Filtering**: Merchant detection and filtering based on known merchant patterns
5. **Visualization**: Processed data feeds into D3 Sankey diagrams and tables

**Key Libraries**:
- `@/lib/csv-parser.ts`: Handles CSV parsing, merchant detection, and transaction normalization
- `@/lib/aggregator.ts`: Aggregates transactions into flows and calculates summary statistics
- `@/lib/theme-context.tsx`: Manages dark/light theme with localStorage persistence

### Backend Architecture

**Server Framework**: Express.js with TypeScript

**Current State**: Minimal backend implementation. The server primarily serves static files and provides API route registration scaffolding. The actual application logic runs entirely client-side.

**Session Management**: Infrastructure exists for connect-pg-simple sessions, but is not actively used since no user authentication is implemented.

**Storage Interface**: Abstract storage interface (`IStorage`) with in-memory implementation (`MemStorage`) for potential future user data persistence.

**Build Process**: Custom esbuild-based build script bundles server code with selected dependencies for optimized cold start times.

### Data Schema

**Transaction Model** (defined in `shared/schema.ts`):
```typescript
{
  id: string
  datetime: Date
  type: string
  status: string
  note: string
  from: string
  to: string
  amount: number
  tip?: number
  tax?: number
  fee?: number
  sourceFile: string
}
```

**Flow Model**: Aggregated transaction data showing total amounts between individuals
```typescript
{
  source: string
  target: string
  value: number
}
```

**Validation**: Zod schemas ensure type safety and runtime validation of parsed data.

### Design System

**Styling**: Tailwind CSS with custom configuration extending the base theme

**Color System**: CSS custom properties for theme colors supporting both light and dark modes. Color palette includes primary (blue), destructive (red), and chart colors for visualizations.

**Typography**: IBM Plex Sans for UI text, IBM Plex Mono for numerical data and code

**Component Architecture**: Radix UI primitives wrapped with custom styling, following the "New York" variant of Shadcn UI for a more refined, professional appearance

**Responsive Design**: Mobile-first approach with breakpoints and adaptive layouts. Mobile menu uses Sheet component for navigation on smaller screens.

### Performance Optimizations

- `useMemo` hooks prevent unnecessary recalculation of aggregated data and visualizations
- Virtual scrolling in transaction tables for large datasets
- Build-time bundling of server dependencies reduces startup overhead
- Client-side processing eliminates server round-trips

## External Dependencies

### Third-Party Libraries

**UI & Interaction**:
- `@radix-ui/*`: Accessible UI primitives (dialogs, dropdowns, tabs, tooltips, etc.)
- `class-variance-authority`: Type-safe component variants
- `tailwindcss`: Utility-first CSS framework
- `lucide-react`: Icon library
- `cmdk`: Command palette component (currently unused)

**Data Processing**:
- `papaparse`: CSV parsing with auto-detection and error handling
- `d3` & `d3-sankey`: Data visualization and Sankey diagram generation
- `zod`: Schema validation and type inference

**React Ecosystem**:
- `@tanstack/react-query`: Data fetching and caching (minimal use, primarily scaffolding)
- `react-hook-form`: Form validation (infrastructure present but not actively used)
- `wouter`: Lightweight routing

**Server**:
- `express`: Web server framework
- `drizzle-orm` & `drizzle-kit`: Database ORM (configured but not currently used)
- `connect-pg-simple`: PostgreSQL session store (infrastructure only)

### Database

**Current State**: Database is configured via Drizzle ORM but not actively used. Schema exists in `shared/schema.ts` with PostgreSQL as the target dialect.

**Future Consideration**: The application could be extended to store user accounts, saved visualizations, or transaction history, which would activate the database layer.

### Build & Development Tools

- `vite`: Frontend build tool and dev server with HMR
- `esbuild`: Server-side bundling
- `tsx`: TypeScript execution for development and build scripts
- Replit-specific plugins for development experience improvements

### APIs & Services

**None**: The application is entirely self-contained with no external API dependencies. All processing happens client-side, ensuring data privacy and eliminating external service costs or rate limits.