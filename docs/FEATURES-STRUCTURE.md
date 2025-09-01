# Features Structure

This directory contains all the feature modules of the application, organized by domain.

## Structure

```
src/features/
├── auth/                 # Authentication feature
│   ├── components/       # Auth-specific components
│   ├── LoginFeature.tsx  # Main login feature component
│   └── index.ts         # Export barrel
├── chat/                # Chat feature
│   ├── components/       # Chat-specific components  
│   ├── ChatFeature.tsx  # Main chat feature component
│   └── index.ts         # Export barrel
└── home/                # Home feature
    ├── HomeFeature.tsx  # Main home feature component
    └── index.ts         # Export barrel
```

## Usage

Each feature is self-contained and can be imported into pages:

```tsx
// In pages
import { LoginFeature } from '@/features/auth';
import { ChatFeature } from '@/features/chat';
import { HomeFeature } from '@/features/home';
```

## Guidelines

1. **Feature Separation**: Each feature should be independent and focused on a single domain
2. **Components**: Feature-specific components go in the `components/` subdirectory
3. **Barrel Exports**: Use `index.ts` files for clean imports
4. **Page Integration**: Pages should only import and render features, not contain business logic
