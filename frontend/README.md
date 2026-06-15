# ChatScape Themes

A modern chat application with customizable themes and real-time messaging capabilities.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <YOUR_GIT_URL>
cd chatscape-themes
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Build Commands

### Development
```bash
npm run dev
```
Starts the development server with hot reload at `http://localhost:5173`

### Production Build
```bash
npm run build
```
Creates an optimized production build in the `dist` directory

### Preview Production Build
```bash
npm run preview
```
Serves the production build locally for testing

### Linting
```bash
npm run lint
```
Runs ESLint to check for code quality issues

### Type Checking
```bash
npm run type-check
```
Runs TypeScript compiler to check for type errors