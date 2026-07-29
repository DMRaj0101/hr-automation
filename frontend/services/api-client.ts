import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const apiClient = axios.create({
  baseURL,
});
