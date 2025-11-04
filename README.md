# Stock Investment Tracker App - React Front End

A React TypeScript front end application for tracking stock investments, financial data, and getting AI insights. The app is currently live on [**`ValuIntel.com`**](https://valuintel.com/)

**Built by Value Investor for Value Investors.**

## Features

- **User Authentication**: Secure registration and login system using JWT
- **Stock Overview**: View saved stocks with real-time prices
- **Financial Data Store**: Input and save financial results of stocks
- **Financial Charts**: Visualize the stock's financial results
- **AI Insights**: Get AI insights on the stock based on the inputted data and web search
- **Investment Decisions**: Make an informed investment decisions.
- **Responsive Design**: Works on desktop and mobile devices


## Planned Features

- **Portfolio Tracking**: Monitor your stock holdings and performance
- **Personal Reminders**: Push notification/email for buy/sell actions
- **Gain/Loss Analysis**: Track your investment performance with detailed analytics
- **Stock Search**: AI-powered search for stocks that fit value investment criteria
- **Test Suites**: Because it is important


## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Styling**: CSS with custom styling, with plan to migrate to Tailwind CSS & shadcn for modern look
- **State Management**: React Context API


## Run the App

### Prerequisites

- Node.js 18
- npm or yarn
- A running Python FastAPI backend server (https://github.com/Izzat1098/stocks_app_backend) which will handle user onboarding, authentication, database storage and AI prompts

### Installation

1. Clone the repository:

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables by creating an `.env` file and adding these lines:
   - REACT_APP_API_URL=http://localhost:8000 (or any other backend url)
   - APP_ENV=development

4. Start the development server:
```bash
npm start
```

The app can then be accessed at [http://localhost:3000](http://localhost:3000)


## Deployment

### Development
Currently, the app is hosted on render.com as static site which is super easy (there is no need to build the app, just link the github repo to the service). Of course, you can use any other hosting services too. More information on this can be found on the service's docs or you can also contact me.