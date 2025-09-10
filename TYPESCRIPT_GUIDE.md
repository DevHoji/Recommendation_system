# TypeScript Best Practices Guide

## Overview
This guide outlines TypeScript best practices to prevent compilation errors during Vercel deployment.

## Common Issues and Solutions

### 1. Proper Interface Definitions

**Problem**: Using `any` types or untyped objects
```typescript
// ❌ Bad
const [filters, setFilters] = useState<any>({});

// ✅ Good
interface MovieFilters {
  genre?: string;
  year?: number;
  minRating?: number;
  sortBy?: string;
  sortOrder?: string;
}
const [filters, setFilters] = useState<MovieFilters>({
  sortBy: 'popularity',
  sortOrder: 'desc'
});
```

### 2. Function Parameter Types

**Problem**: Untyped function parameters
```typescript
// ❌ Bad
const handleFilterChange = async (newFilters: any) => {

// ✅ Good
const handleFilterChange = async (newFilters: MovieFilters) => {
```

### 3. Import Statements

**Problem**: Using `require()` in TypeScript
```typescript
// ❌ Bad
const { allMockMovies } = require('@/lib/mock-data');

// ✅ Good
import { allMockMovies, searchMockMovies } from '@/lib/mock-data';
```

### 4. Object Property Access

**Problem**: Accessing properties on untyped objects
```typescript
// ❌ Bad - TypeScript doesn't know what properties exist
currentFilters.sortBy || 'popularity'

// ✅ Good - With proper interface, TypeScript knows the structure
interface MovieFilters {
  sortBy?: string;
}
currentFilters.sortBy || 'popularity'
```

## Pre-Deployment Checklist

1. **Run TypeScript Check**
   ```bash
   npm run build
   ```

2. **Fix All TypeScript Errors**
   - No `Property 'X' does not exist on type 'Y'` errors
   - No `any` types where specific types can be used
   - No `require()` imports in TypeScript files

3. **Common Error Patterns to Watch For**
   - Uninitialized state objects: `useState({})`
   - Missing interface definitions
   - Incorrect object destructuring
   - Missing return type annotations for complex functions

## File-Specific Guidelines

### API Routes (`/api/**/*.ts`)
- Always type request/response objects
- Use proper error handling with typed catch blocks
- Import dependencies using ES6 imports

### React Components (`/components/**/*.tsx`)
- Define interfaces for props and state
- Type event handlers properly
- Use proper generic types for hooks

### Utility Functions (`/lib/**/*.ts`)
- Export typed functions with clear parameter and return types
- Avoid `any` types - use generics or union types instead
- Document complex type definitions

## Testing TypeScript Changes

Before pushing to GitHub:
1. Run `npm run build` locally
2. Fix any TypeScript compilation errors
3. Ensure all warnings are addressed or documented
4. Test functionality in development mode

## Vercel Deployment Requirements

Vercel requires:
- Zero TypeScript compilation errors
- All imports must be resolvable
- Proper type definitions for all exported functions
- No circular dependencies

Following these guidelines will prevent TypeScript compilation errors during Vercel deployment.
