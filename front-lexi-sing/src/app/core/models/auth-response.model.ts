import { User } from './user.model';

export interface AuthResponse {
  user: User | null;
  token?: string | null;
  code?: string | null;
  message?: string;
  error?: any;
}
