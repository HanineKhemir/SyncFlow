export interface JwtPayload {
  username: string;
  sub: number; // The user's ID
  role: string;
  companyCode: string;
}
