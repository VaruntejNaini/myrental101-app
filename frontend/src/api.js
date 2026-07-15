import axios from "axios";
import { STORAGE_KEYS } from "./constants/auth";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
});

API.interceptors.request.use((req) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);

    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }

    return req;
});

export default API;