# Flashcards Learning Application

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/M1szau/FlashcardsProject-copy.git
cd FlashcardsProject-copy
```

### 2. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd FlashcardsBackend
npm install
```

### 3. Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
cd ../FlashcardsFrontend
npm install
```

### 4. Start the Application

#### Option A: Manual Start (Recommended for Development)

**Terminal 1 - Start Backend Server:**
```bash
cd FlashcardsBackend
npm run dev
# Server will start on http://localhost:3001
```

**Terminal 2 - Start Frontend Development Server:**
```bash
cd FlashcardsFrontend
npm run dev
# Frontend will start on http://localhost:5173
```

#### Option B: Production Start

**Backend:**
```bash
cd FlashcardsBackend
npm start
```

**Frontend:**
```bash
cd FlashcardsFrontend
npm run build
npm run preview
```

### 5. Access the Application

Open your web browser and navigate to:
- **Frontend**: http://localhost:5173 (development) or http://localhost:4173 (preview)
- **Backend API**: http://localhost:3001

## 🛠 Tech Stack

### Frontend
- **React 19** with TypeScript
- **React Router DOM** for navigation
- **React i18next** for internationalization
- **Vite** for build tooling
- **Vitest** for testing
- **React Icons** for UI icons
- **Country Flag Icons** for language flags

### Backend
- **Node.js** with Express
- **LowDB** for JSON-based database storage
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS** for cross-origin requests
- **Multer** for file handling

### Development Tools
- **ESLint** for code linting
- **TypeScript** for type safety
- **Vitest** for unit testing
- **Coverage reporting** with @vitest/coverage-v8

## Prerequisites

Before installing and running this application, ensure you have:

- **Node.js** (version 16 or higher)
- **npm** (version 7 or higher)
- **Git** for version control


## File Formats

### JSON Import/Export Format

```json
{
  "set": {
    "name": "My Vocabulary Set",
    "description": "Basic vocabulary for learning",
    "defaultLanguage": "EN",
    "translationLanguage": "PL"
  },
  "flashcards": [
    {
      "content": "Hello",
      "translation": "Cześć",
      "language": "EN",
      "translationLang": "PL",
      "known": false
    }
  ]
}
```

### CSV Import/Export Format

```csv
Set Name,Set Description,Default Language,Translation Language,Content,Translation,Content Language,Translation Language,Known,Created At
My Set,Description,EN,PL,Hello,Cześć,EN,PL,false,2024-01-01T10:00:00.000Z
```


## Project Structure

```
FlashcardsProject/
├── FlashcardsBackend/          # Express.js backend
│   ├── data/
│   │   └── db.json            # JSON database file
│   ├── __tests__/             # Backend tests
│   ├── coverage/              # Test coverage reports
│   ├── database.js            # Database operations
│   ├── server.js              # Express server
│   └── package.json
│
├── FlashcardsFrontend/         # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── dashboard/     # Dashboard components
│   │   │   ├── flashcards/    # Flashcard components
│   │   │   └── login and register/ # Auth components
│   │   ├── contexts/          # React contexts
│   │   ├── hooks/             # Custom hooks
│   │   ├── languages/         # i18n translation files
│   │   ├── types and interfaces/ # TypeScript definitions
│   │   ├── __tests__/         # Frontend tests
│   │   └── assets/            # Static assets
│   ├── public/                # Public assets
│   ├── coverage/              # Test coverage reports
│   └── package.json
│
├── CSVtest.csv                # Sample CSV import file
├── JSONtest.json              # Sample JSON import file
└── README.md                  # This file
```

### Deployment 
Link to deployed website on Render: https://flashcardsproject-nkb7.onrender.com
