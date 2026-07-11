# Client - CV Management System

Frontend for the CV Management System course project.

For the full project overview, architecture notes, feature list, and demo links, see the root README: `../README.md`.

## Stack

- React
- Vite
- JavaScript
- Ant Design
- Axios
- TanStack Query
- `react-markdown`
- `remark-gfm`

## Local Setup

```bash
cd client
npm install
cp .env.example .env.local
npm run dev
```

Default local URL: `http://localhost:5173`

If Vite starts on another port, use the URL printed in the terminal.

## Environment Variable

```env
VITE_API_BASE_URL=http://localhost:4000
```

## Build

```bash
npm run build
```

## Frontend Scope

The frontend includes:

- demo login and OAuth completion flow
- role-based navigation and visibility
- Attribute Library management
- Position Template management
- Candidate profile values and auto-save
- Candidate projects with Markdown descriptions
- CV creation, preview, publish, likes, and delete flow
- Recruiter read-only published CV review
- guest public pages, search, and statistics
- EN / UZ language switch
- light / dark theme

## Notes

- Navigation uses the current app state approach used in the project rather than React Router page routing.
- Main table actions are toolbar-based; row action buttons are intentionally avoided in the primary flows.
