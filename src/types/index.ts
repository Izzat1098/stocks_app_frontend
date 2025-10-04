// User types
export interface User {
  username: string;
  email: string;
}

export interface UserRegistration {
  username: string;
  email: string;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  username: string;
  email: string;
}

// Stock types
export interface StockPrice {
  ticker: string;
  abbreviation: string;
  currentPrice: number;
  fetchedDateTime: string;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  detail: string;
}

// Reference types
export interface Countries {
  name: string;
}

export interface Sectors {
  name: string;
}