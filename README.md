# Stock Investment Tracker App

A React TypeScript application for tracking stock investments and monitoring portfolio performance.

## Features

- **User Authentication**: Secure registration and login system
- **Stock Overview**: View available stocks with real-time prices
- **Portfolio Tracking**: Monitor your stock holdings and performance
- **Gain/Loss Analysis**: Track your investment performance with detailed analytics
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Styling**: CSS with custom styling
- **State Management**: React Context API

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Navbar.tsx      # Navigation component
│   └── ProtectedRoute.tsx # Route protection wrapper
├── pages/              # Page components
│   ├── HomePage.tsx    # Landing page
│   ├── LoginPage.tsx   # User login
│   ├── RegisterPage.tsx # User registration
│   └── StocksOverviewPage.tsx # Main stocks dashboard
├── services/           # API services
│   ├── api.ts         # Base API configuration
│   └── stockService.ts # Stock-related API calls
├── context/           # React Context providers
│   └── AuthContext.tsx # Authentication state management
├── types/             # TypeScript type definitions
│   └── index.ts       # Type definitions for the app
├── App.tsx            # Main application component
├── index.tsx          # Application entry point
└── index.css          # Global styles
```

## Environment Configuration

The app supports different environments through environment variables:

### Development (.env.development)
```
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_ENV=development
```

### Production (.env.production)
```
REACT_APP_API_BASE_URL=https://your-production-api.com
REACT_APP_ENV=production
```

## Getting Started

### Prerequisites

- Node.js 16 or higher
- npm or yarn
- A running FastAPI backend server

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Izzat1098/stocks_app_frontend.git
cd stocks_app_frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.development` and update the API URL if needed
   - For production, update `.env.production` with your production API URL

4. Start the development server:
```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `npm start` - Start the development server
- `npm build` - Build the app for production
- `npm test` - Run the test suite
- `npm run eject` - Eject from Create React App (not recommended)

## API Integration

The app expects a FastAPI backend with the following endpoints:

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login

### Stocks
- `GET /stocks` - Get all available stocks
- `GET /stocks/{symbol}` - Get specific stock details

### Holdings
- `GET /holdings` - Get user's stock holdings
- `POST /holdings` - Add new stock holding
- `PUT /holdings/{id}` - Update existing holding
- `DELETE /holdings/{id}` - Delete holding

## Deployment

### Development
The app runs on `http://localhost:3000` by default and expects the API at `http://localhost:8000`.

### Production
1. Update `.env.production` with your production API URL
2. Build the application:
```bash
npm run build
```
3. Deploy the `build` folder to your hosting service (Netlify, Vercel, AWS S3, etc.)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
