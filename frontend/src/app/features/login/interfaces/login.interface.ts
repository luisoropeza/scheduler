export interface loginRequest {
  email: string;
  password: string;
}

export interface loginResponse {
  token: string
}
export interface tokenResponse {
  role:string
 }
