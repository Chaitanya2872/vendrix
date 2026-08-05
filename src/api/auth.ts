import axios from "axios";
import { setAccessToken } from "./axios";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

type LoginResponse = { access_token: string; token_type?: string };

export async function login(email: string, password: string, remember = true): Promise<void> {
  const { data } = await axios.post<LoginResponse>(`${baseURL}/auth/login`, {
    email,
    password,
  });
  setAccessToken(data.access_token, remember);
}
