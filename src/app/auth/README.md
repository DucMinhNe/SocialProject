# Auth Structure

This directory contains authentication-related routes and features.

## Structure

```
src/app/auth/
├── layout.tsx           # Shared layout for auth pages
├── page.tsx            # Redirect to /auth/login
├── login/
│   └── page.tsx        # Login page
└── register/
    └── page.tsx        # Register page

src/features/auth/
├── LoginFeature.tsx     # Original full login feature (deprecated)
├── LoginFormFeature.tsx # Login form only
├── RegisterFeature.tsx  # Register form
└── index.ts            # Export barrel
```

## Routes

- `/auth` → Redirects to `/auth/login`
- `/auth/login` → Login form with link to register
- `/auth/register` → Register form with link to login
- `/login` → Legacy route, redirects to `/auth/login`

## Features

1. **Shared Layout**: Common header and styling for all auth pages
2. **Auto-redirect**: If user is already logged in, redirects to `/chat`
3. **Form Validation**: Client-side validation for register form
4. **Google Auth**: Available on both login and register pages
5. **Cross-navigation**: Easy links between login and register

## Layout Features

- Responsive design
- Loading states
- Auto-redirect for authenticated users
- Consistent branding and styling
