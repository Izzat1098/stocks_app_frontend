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
export interface Stock {
  id: number;
  symbol: string;
  name: string;
  current_price: number;
  change: number;
  change_percent: number;
}

export interface Holding {
  id: number;
  user_id: number;
  stock_id: number;
  symbol: string;
  name: string;
  shares: number;
  purchase_price: number;
  current_price: number;
  total_value: number;
  gain_loss: number;
  gain_loss_percent: number;
  purchase_date: string;
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