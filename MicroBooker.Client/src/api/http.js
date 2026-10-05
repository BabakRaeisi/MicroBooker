import axios from "axios";
import { requestFinished, requestStarted } from "../diagnostics";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  config.__profileRequestId = requestStarted(
    config.method,
    `${config.baseURL || ""}${config.url || ""}`,
  );

  return config;
});

http.interceptors.response.use(
  (response) => {
    requestFinished(
      response.config.__profileRequestId,
      response.status,
    );
    return response;
  },
  (error) => {
    requestFinished(
      error.config?.__profileRequestId,
      error.response?.status,
      error,
    );
    return Promise.reject(error);
  },
);

export default http;
