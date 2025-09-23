# TrackeOneFinance

A comprehensive financial management system designed to help users manage personal or business finances through a web interface.

## 🌟 Features

- **Dashboard** - Financial overview with charts and summaries
- **Transaction Management** - Create, edit, filter, and categorize transactions
- **Account Management** - Track bank accounts and credit cards
- **Category System** - Organize expenses and income with categories and subcategories
- **Cost Centers** - Track expenses by cost center
- **Contact Management** - Manage financial contacts
- **Monthly Control** - Monthly financial analysis and reporting
- **Cash Flow Analysis** - Track money flow patterns
- **Settings Panel** - Configure system preferences

## 🛠 Technology Stack

### Frontend
- **React** 19.1.1 with TypeScript
- **Material-UI (MUI)** 7.3.1 for UI components
- **React Router DOM** 7.8.2 for navigation
- **Vite** for fast development and building
- **Axios** for API communication
- **Emotion** for styled components

### Backend
- **Node.js** with TypeScript
- **Express** 5.1.0 for REST API
- **SQLite3** for development database
- **PostgreSQL** for production database
- **CORS** enabled
- **dotenv** for environment configuration
- **JWT** for authentication

## 📁 Project Structure

```
TrackeOneFinance/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service layer
│   │   └── styles/        # CSS files
│   └── package.json
├── server/                # Backend Node.js application
│   ├── src/
│   │   ├── controllers/   # Business logic
│   │   ├── routes/        # API routes
│   │   └── database/      # Database connection and migrations
│   └── package.json
├── database/              # SQL schema files
└── package.json          # Root package.json for concurrent execution
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TrackeOneFinance
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Install server dependencies**
   ```bash
   cd server
   npm install
   cd ..
   ```

### Environment Configuration

#### Server Environment (.env)
Create a `.env` file in the `server` directory:

```env
# Para desenvolvimento (SQLite)
DATABASE_PATH=database/track_one_finance.db

# Para produção (PostgreSQL)
# DATABASE_URL=postgresql://user:password@host:port/database

# Segredo JWT para autenticação
JWT_SECRET=trackeone_finance_secret_key_2025

# Porta do servidor
PORT=3001

# Ambiente (development ou production)
NODE_ENV=development
```

#### Client Environment (.env)
Create a `.env` file in the `client` directory:

```env
# URL da API em desenvolvimento
VITE_API_URL=http://localhost:3001
```

### Database Setup

1. **Initialize the database**
   ```bash
   # Navigate to the server directory
   cd server
   
   # The database will be automatically created when you first run the server
   ```

2. **(Optional) Create a test user**
   ```bash
   # Run the test user creation script
   node ../create_test_user.js
   
   # This will generate a SQL script to create a test user
   # Email: admin@trackone.com
   # Password: admin123
   ```

### Development

#### Run both client and server simultaneously
```bash
npm run dev
```

This command runs both the frontend and backend in development mode:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001

#### Run individually

**Frontend only:**
```bash
npm run client
```

**Backend only:**
```bash
npm run server
```

### Building for Production

**Build client:**
```bash
cd client
npm run build
```

**Build server:**
```bash
cd server
npm run build
```

## 💾 Database

The application uses SQLite for development and PostgreSQL for production.

**Development Database location:** `database/track_one_finance.db`

**Schema files:**
- `database/initial.sql` - Complete schema
- `database/initial_clean.sql` - Clean schema without data

### Database Migrations

The application includes database migrations to ensure consistency between development and production environments:

- **Parcelamento fields**: Added support for installment transactions
- **Recurrence fields**: Added support for recurring transactions
- **Boolean value normalization**: Ensures boolean values are treated as 0/1 in SQLite and true/false in PostgreSQL
- **Card number field fix**: Increased card_number field size from VARCHAR(4) to VARCHAR(20) to accommodate full credit card numbers

For details about database migrations, see [BOOLEAN_VALUES_MIGRATION.md](BOOLEAN_VALUES_MIGRATION.md)

### Database Migration Scripts

To apply database fixes and updates:

**Apply card number field correction:**
```bash
npm run fix-card-number
```

This script automatically detects the database type (SQLite or PostgreSQL) and applies the appropriate correction.

## 📊 API Endpoints

The backend provides REST API endpoints at `http://localhost:3001/api/`

### Authentication endpoints:
- `POST /api/auth/login` - User login