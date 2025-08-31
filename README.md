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

## 📊 API Endpoints

The backend provides REST API endpoints at `http://localhost:3001/api/`

### Authentication endpoints:
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/validate` - Token validation
- `POST /api/auth/refresh` - Token refresh

### Main endpoints:
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `GET /api/bank-accounts` - List bank accounts
- `GET /api/categories` - List categories
- `GET /api/dashboard/overview` - Dashboard data

For complete API documentation, see the controllers in `server/src/controllers/`

## 🧪 Development Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both client and server in development mode |
| `npm run client` | Start only the frontend development server |
| `npm run server` | Start only the backend development server |
| `npm run build` | Build both client and server for production |

## 🔧 Configuration

### Environment Variables

#### Server (.env in server directory):
```env
DATABASE_PATH=database/track_one_finance.db
JWT_SECRET=trackeone_finance_secret_key_2025
PORT=3001
NODE_ENV=development
```

#### Client (.env in client directory):
```env
VITE_API_URL=http://localhost:3001
```

### Production Deployment

For production deployment instructions, see:
- [DEPLOY_INSTRUCTIONS.md](DEPLOY_INSTRUCTIONS.md)
- [DEPLOY_RENDER_GUIA.md](DEPLOY_RENDER_GUIA.md)
- [DEPLOY_VERCEL_GUIA.md](DEPLOY_VERCEL_GUIA.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🐛 Known Issues

- Recurring transactions are under development
- Testing framework needs to be configured

## 🗺 Roadmap

- [x] Add user authentication
- [ ] Implement recurring transactions
- [ ] Add data export/import functionality
- [ ] Create mobile responsive design
- [ ] Add unit and integration tests
- [ ] Implement backup and restore functionality

## 📞 Support

For support and questions, please open an issue in the repository.

---

**Made with ❤️ for better financial management**