# AI Agent Guidelines

This document provides guidance for AI agents working with the `use-experiment` codebase.

## Project Overview

`use-experiment` is a lightweight React hook library that enables reactive feature toggles by reading from `window.experiments`. The library provides a simple API for components to respond to experiment flags without requiring providers or prop drilling.

## Architecture

### Core Components

- **Main Hook**: `useExperiment<T = boolean>(key: string, fallback?: T)` - The primary export
- **Store Management**: Uses a shared proxy on `window` to track changes via the `on-change` library
- **Type Support**: Generic type parameter allows boolean (default), string, number, or custom types

### Key Design Principles

1. **Zero Configuration**: No providers or context setup required
2. **Global State**: Single shared store on `window.experiments`
3. **Reactive**: Components automatically re-render when experiment values change
4. **Type Safe**: Full TypeScript support with generic types

## Development Guidelines

### Code Style

- Written in TypeScript
- Uses modern ES6+ features
- Follows functional programming patterns for React hooks
- Minimal dependencies (only `on-change` for reactivity)

### Build System

- Uses `tsup` for building
- Outputs ESM, CJS, and TypeScript declarations
- Entry point: `src/index.ts`

### Scripts

```bash
npm run build   # Build for production
npm run dev     # Build and watch for changes
```

## Common Tasks

### Adding New Features

When extending functionality:
1. Maintain backward compatibility
2. Keep the API surface minimal
3. Ensure TypeScript types are properly exported
4. Update README.md with usage examples

### Testing Changes

While there are no tests in the current setup, when making changes:
1. Test with React 16.8+, 17, and 18
2. Verify both ESM and CJS module formats work
3. Check TypeScript type inference works correctly
4. Test boolean normalization edge cases

### Dependencies

- **Runtime**: `on-change` (for proxy-based change detection)
- **Peer**: `react` (16.8.0+, supporting hooks)
- **Dev**: `typescript`, `tsup`, `@types/react`

## File Structure

```
use-experiment/
├── src/
│   └── index.ts          # Main hook implementation
├── dist/                 # Built output (generated)
├── package.json          # Package configuration
├── tsconfig.json         # TypeScript configuration
├── README.md             # User documentation
└── AGENTS.md            # This file
```

## API Contract

The hook must maintain this contract:

```typescript
function useExperiment<T = boolean>(
  key: string,
  fallback?: T
): T;
```

### Behavior Requirements

1. **First render**: Returns `fallback` if `window.experiments[key]` is undefined
2. **Type coercion**: For boolean type (default), normalize strings like "true", "false", "yes", "no", "0", "1" and numbers
3. **Reactivity**: Re-render component when `window.experiments[key]` changes
4. **Shared store**: All hook instances share the same proxy instance

## Integration Points

### External Systems

This library is designed to work with:
- Feature flag platforms (LaunchDarkly, Optimizely, etc.)
- Custom experiment frameworks
- Tag managers (Google Tag Manager, Segment, etc.)
- Any system that can write to `window.experiments`

### Browser Compatibility

- Requires Proxy support (modern browsers)
- Requires React with hooks support (16.8+)

## Publishing

Before publishing:
1. Update version in `package.json`
2. Run `npm run build` to generate distribution files
3. Ensure `dist/` contains `.js`, `.cjs`, and `.d.ts` files
4. Verify `files` field in `package.json` includes `dist`

## Contributing Notes

When contributing or making changes:
- Keep the library small and focused
- Avoid adding unnecessary dependencies
- Document breaking changes clearly
- Consider backward compatibility
- Update TypeScript types alongside implementation changes
