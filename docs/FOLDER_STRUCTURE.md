# Project Folder Structure

## Industry-Standard React Application Structure

```
realtime-transcribe/
├── public/                 # Static assets
│   ├── index.html
│   ├── manifest.json
│   ├── sw.js
│   └── ...
├── src/
│   ├── components/         # React components
│   │   ├── common/        # Shared/reusable components
│   │   │   ├── ThemeToggle.jsx
│   │   │   └── index.js
│   │   └── features/     # Feature-specific components
│   │       ├── TranscriptPane.jsx
│   │       ├── SuggestionsPane.jsx
│   │       ├── AnalysisPane.jsx
│   │       ├── AssistantPane.jsx
│   │       ├── SessionModal.jsx
│   │       └── index.js
│   ├── pages/            # Page components (routes)
│   │   ├── HomePage.jsx
│   │   ├── SessionsPage.jsx
│   │   ├── MaterialsPage.jsx
│   │   └── HelpPage.jsx
│   ├── layouts/          # Layout components
│   │   └── Layout.jsx
│   ├── hooks/            # Custom React hooks
│   │   ├── useRealtimeTranscription.js
│   │   └── useSession.js
│   ├── store/            # State management (Zustand)
│   │   ├── useSessionStore.js
│   │   └── useMaterialsStore.js
│   ├── services/         # API services
│   │   └── api.js
│   ├── utils/            # Utility functions
│   │   ├── emailParser.js
│   │   └── sessionStorage.js
│   ├── context/          # React contexts
│   │   └── ThemeContext.jsx
│   ├── theme/            # Theme configuration
│   │   └── theme.js
│   ├── constants/        # Application constants
│   │   └── index.js
│   ├── types/            # TypeScript types (if using TS)
│   ├── App.jsx           # Root component
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── data/                 # User data (not in src)
│   ├── Mentoring Materials/
│   └── sessions/
├── server.js             # Express backend
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## Structure Principles

### 1. **Separation of Concerns**
- **Components**: UI only, no business logic
- **Services**: API calls and external integrations
- **Store**: Global state management
- **Utils**: Pure functions, no side effects
- **Hooks**: Reusable stateful logic

### 2. **Feature-Based Organization**
- **common/**: Shared across multiple features
- **features/**: Specific to one feature
- **pages/**: Route-level components

### 3. **Scalability**
- Easy to add new features
- Clear import paths
- Consistent naming conventions

### 4. **Maintainability**
- Related code grouped together
- Clear boundaries between layers
- Easy to find and modify code

## Import Paths

### Before (Flat Structure)
```javascript
import TranscriptPane from '../components/TranscriptPane';
import { useSessionStore } from '../store/useSessionStore';
```

### After (Organized Structure)
```javascript
import { TranscriptPane } from '../components/features';
import { useSessionStore } from '../store/useSessionStore';
```

## Benefits

✅ **Industry Standard**: Follows React best practices
✅ **Scalable**: Easy to add new features
✅ **Maintainable**: Clear organization
✅ **Team-Friendly**: Easy for new developers to understand
✅ **Type-Safe**: Ready for TypeScript migration
