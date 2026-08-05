import axios from "axios";

// Points at the FastAPI backend (default port 8000, per docker-compose.yml
// and `uvicorn main:app --port 8000`). Keep this separate from
// `api-client.ts`, which still points at the mock JSON server (port 4000)
// for the screens that haven't migrated yet (login, tickets, monitoring,
// knowledge).
const backendBaseURL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ?? "http://localhost:8000";

export const backendApiClient = axios.create({
  baseURL: backendBaseURL,
});