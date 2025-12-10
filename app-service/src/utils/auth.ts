import axios from "axios";
import { TokenPayload } from "../types";

const authServiceUrl = process.env.AUTH_SERVICE_URL || "http://localhost:3001";

export const verifyToken = async (
  token: string
): Promise<TokenPayload | null> => {
  try {
    const response = await axios.post(`${authServiceUrl}/api/auth/verify`, {
      token,
    });

    if (response.status === 200 && response.data.valid) {
      return {
        userId: response.data.userId,
        email: response.data.email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900, // 15 minutes
      };
    }

    return null;
  } catch (error) {
    console.error("Token verification failed:");
    return null;
  }
};

export const refreshAccessToken = async (
  refreshToken: string
): Promise<string | null> => {
  try {
    const response = await axios.post(`${authServiceUrl}/api/auth/refresh`, {
      refreshToken,
    });

    if (response.status === 200) {
      return response.data.accessToken;
    }

    return null;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return null;
  }
};
