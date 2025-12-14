import axios from "axios";

const API_BASE = "http://localhost:8000/api";

export const api = axios.create({
    baseURL: API_BASE,
    headers: {
        "Content-Type": "application/json",
    },
});

// Interceptor to add token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const getCompanies = async () => {
    const res = await api.get("/excel/companies");
    return res.data;
};

export const exportValuation = async (id: string) => {
    const res = await api.get(`/excel/valuation/${id}/export`);
    return {
        data: res.data,
        etag: res.headers["etag"],
    };
};

export const importValuation = async (data: any, etag?: string) => {
    const headers: any = {};
    if (etag) {
        headers["If-Match"] = etag;
    }
    const res = await api.post("/excel/import", data, { headers });
    return res.data;
};
