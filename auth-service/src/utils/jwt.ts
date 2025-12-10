import * as jwt from "jsonwebtoken";
import { TokenPayload, AuthTokens } from "../types";

const JWT_SECRET: string =
  process.env.JWT_SECRET || "default_secret_key_change_in_production";
const JWT_REFRESH_SECRET: string =
  process.env.JWT_REFRESH_SECRET ||
  "default_refresh_secret_key_change_in_production";
const JWT_ACCESS_EXPIRE: string = process.env.JWT_ACCESS_EXPIRE || "15m";
const JWT_REFRESH_EXPIRE: string = process.env.JWT_REFRESH_EXPIRE || "7d";

export const generateTokens = (userId: string, email: string): AuthTokens => {
  const payload = { userId, email };

  const accessToken = jwt.sign(
    payload as unknown as jwt.JwtPayload,
    JWT_SECRET as unknown as jwt.Secret,
    { expiresIn: JWT_ACCESS_EXPIRE } as unknown as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    payload as unknown as jwt.JwtPayload,
    JWT_REFRESH_SECRET as unknown as jwt.Secret,
    { expiresIn: JWT_REFRESH_EXPIRE } as unknown as jwt.SignOptions
  );

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(
      token,
      JWT_SECRET as unknown as jwt.Secret
    ) as TokenPayload;
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(
      token,
      JWT_REFRESH_SECRET as unknown as jwt.Secret
    ) as TokenPayload;
  } catch (error) {
    return null;
  }
};
