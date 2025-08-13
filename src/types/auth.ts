export interface User {
  id: string;
  profileId?: string;
  handle?: string;
  isPending?: boolean;
  matrixId?: string;
  primaryZID?: string;
  totalRewards?: string;
  isDeleted?: boolean;
  stripeCustomerId?: string;
  createdAt: string;
  updatedAt: string;
  profileSummary?: {
    id: string;
    firstName?: string;
    lastName?: string;
    primaryEmail?: string;
    profileImage?: string;
  };
  wallets?: Array<{
    id: string;
    userId: string;
    publicAddress: string;
    isDefault: boolean;
    isMultiSig: boolean;
    balance?: string | null;
    balanceCheckedAt?: string | null;
    dailyLimit?: string | null;
    requiredConfirmations?: number | null;
    name?: string | null;
    data?: any;
    isThirdWeb: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  subscriptions?: {
    zeroPro: boolean;
    wilderPro: boolean;
  };
  role?: string;
  primaryWalletAddress?: string;
  zeroWalletAddress?: string;
  followersCount?: string;
  followingCount?: string;
  
  // Matrix integration
  matrixAccessToken?: string;
  
  // Legacy fields for backward compatibility
  email?: string;
  username?: string;
  name?: string;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  username?: string;
  name?: string;
  inviteCode?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  accessToken?: string; // Zero.tech access token
  access_token?: string; // Alternative field name
  ssToken?: string; // Alternative field name
  sessionToken?: string; // Alternative field name
  zos_access_token?: string; // Alternative field name
}

export interface SyncRequest {
  inviteCode?: string;
}

export interface SyncResponse {
  user?: User;
  isNewUser: boolean;
  message?: string;
}

export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Matrix-specific types
export interface MatrixSSOTokenResponse {
  token: string;
}

export interface MatrixConfig {
  homeserverUrl?: string;
  accessToken?: string;
  userId?: string;
}
