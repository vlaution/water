// API Configuration
// Automatically uses the correct backend URL based on environment

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
console.log('API Configured URL:', API_URL);

export const api = {
    baseURL: API_URL,

    // Helper to build full URLs
    url: (path: string) => `${API_URL}${path}`,

    // Common endpoints
    endpoints: {
        auth: {
            login: '/auth/login',
            signup: '/auth/signup',
            me: '/auth/me',
        },
        runs: '/runs',
        upload: '/upload',
        calculate: '/calculate',
        run: (id: string) => `/run/${id}`,
        runDetail: (id: string) => `/runs/${id}`,
        export: (type: string, runId: string) => `/export/${type}/${runId}`,
        risk: {
            correlation: {
                financial: '/api/risk/correlation/financial',
                qualitative: '/api/risk/correlation/qualitative',
            },
            stress: {
                scenarios: '/api/risk/scenarios',
                run: (scenario: string) => `/api/risk/stress-test/${scenario}`,
            },
            concentration: {
                sector: '/api/risk/concentration/sector',
                stage: '/api/risk/concentration/stage',
                powerLaw: '/api/risk/concentration/power-law',
            },
            health: '/api/risk/health',
        }
    },
};

// Helper for fetch with default headers
export const apiFetch = async (url: string, options: RequestInit = {}, token?: string | null) => {
    const headers = new Headers(options.headers);

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    return fetch(api.url(url), {
        ...options,
        headers,
    });
};
