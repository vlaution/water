import * as React from "react";
import { useState, useEffect } from "react";
import { Button, Input, Label, Spinner, Dropdown, Option, Badge } from "@fluentui/react-components";
import { api, getCompanies, exportValuation, importValuation } from "../utils/api";
import { writeValuationToExcel, readValuationFromExcel } from "../utils/excel-utils";
import { OfflineManager } from "../utils/offline-manager";

const App = () => {
    const [token, setToken] = useState<string | null>(localStorage.getItem("auth_token"));
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [companies, setCompanies] = useState<string[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<string>("");
    const [status, setStatus] = useState("");
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [pendingSyncs, setPendingSyncs] = useState(OfflineManager.getQueue().length);

    // Monitor Online Status
    useEffect(() => {
        const handleStatusChange = () => {
            setIsOffline(!navigator.onLine);
            // If coming online, we could auto-sync here
        };
        window.addEventListener('online', handleStatusChange);
        window.addEventListener('offline', handleStatusChange);
        return () => {
            window.removeEventListener('online', handleStatusChange);
            window.removeEventListener('offline', handleStatusChange);
        };
    }, []);

    // Load companies on auth
    useEffect(() => {
        if (token && !isOffline) {
            loadCompanies();
        }
    }, [token, isOffline]);

    const login = async () => {
        if (isOffline) {
            setStatus("Cannot login while offline");
            return;
        }
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("username", email);
            formData.append("password", password);

            const res = await api.post("/auth/login", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            const newToken = res.data.access_token;
            setToken(newToken);
            localStorage.setItem("auth_token", newToken);
            setStatus("Logged in");
        } catch (e) {
            setStatus("Login failed");
        } finally {
            setLoading(false);
        }
    };

    const loadCompanies = async () => {
        try {
            const list = await getCompanies();
            setCompanies(list);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSyncToExcel = async () => {
        if (!selectedCompany) return;
        setLoading(true);
        setStatus("Fetching data...");

        try {
            let data;
            if (isOffline) {
                // Try Cache
                data = OfflineManager.getValuation(selectedCompany);
                if (!data) throw new Error("No cached data found for this ID");
                setStatus("Loaded from Cache (Offline)");
            } else {
                // Try API
                try {
                    const res = await exportValuation(selectedCompany);
                    data = res.data;
                    // Cache it
                    OfflineManager.saveValuation(selectedCompany, data);
                } catch (e) {
                    // Fallback to cache if API fails
                    console.warn("API failed, checking cache", e);
                    data = OfflineManager.getValuation(selectedCompany);
                    if (!data) throw e;
                    setStatus("Loaded from Cache (Network Error)");
                }
            }

            await writeValuationToExcel(data);
            if (!isOffline && status !== "Loaded from Cache (Network Error)") setStatus("Data loaded to Excel");
        } catch (e: any) {
            setStatus("Sync failed: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSyncToPlatform = async () => {
        setLoading(true);
        setStatus("Reading Excel...");
        try {
            const data = await readValuationFromExcel();

            if (isOffline) {
                // Queue it
                OfflineManager.addToQueue(data);
                setPendingSyncs(OfflineManager.getQueue().length);
                setStatus("Offline: Changes queued for sync");
                return;
            }

            try {
                await importValuation(data, data.etag);
                setStatus("Platform updated successfully");
            } catch (e: any) {
                if (e.response && e.response.status === 412) {
                    // Conflict detected
                    const overwrite = confirm("Conflict detected! Data on server is newer. \n\nClick OK to OVERWRITE server data with your Excel data.\nClick Cancel to keep server data (you should then reload).");

                    if (overwrite) {
                        await importValuation(data);
                        setStatus("Platform updated (Overwritten)");
                    } else {
                        setStatus("Update cancelled. Please reload data.");
                    }
                } else {
                    // Network error? Queue it?
                    // For now, just show error
                    throw e;
                }
            }
        } catch (e: any) {
            setStatus("Update failed: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const processQueue = async () => {
        if (isOffline) return;
        setLoading(true);
        const queue = OfflineManager.getQueue();
        let successCount = 0;

        for (const item of queue) {
            try {
                await importValuation(item.data); // Force update for queued items? Or check ETag? Let's force for now.
                OfflineManager.removeFromQueue(item.id);
                successCount++;
            } catch (e) {
                console.error("Failed to sync item", item.id, e);
            }
        }
        setPendingSyncs(OfflineManager.getQueue().length);
        setStatus(`Processed queue: ${successCount} synced`);
        setLoading(false);
    };

    if (!token) {
        return (
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                <h2>Login</h2>
                {isOffline && <div style={{ color: 'red' }}>OFFLINE MODE</div>}
                <Label>Email</Label>
                <Input value={email} onChange={(e, d) => setEmail(d.value)} />
                <Label>Password</Label>
                <Input type="password" value={password} onChange={(e, d) => setPassword(d.value)} />
                <Button appearance="primary" onClick={login} disabled={loading || isOffline}>
                    {loading ? <Spinner size="tiny" /> : "Login"}
                </Button>
                <p>{status}</p>
            </div>
        );
    }

    return (
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            <h2>Valuation Connect</h2>
            {isOffline && <Badge color="danger">OFFLINE</Badge>}
            {pendingSyncs > 0 && (
                <div style={{ background: '#fff3cd', padding: 5, borderRadius: 4 }}>
                    {pendingSyncs} changes pending.
                    {!isOffline && <Button size="small" onClick={processQueue}>Sync Now</Button>}
                </div>
            )}

            <Label>Valuation ID</Label>
            <Input
                placeholder="Enter Valuation ID"
                value={selectedCompany}
                onChange={(e, d) => setSelectedCompany(d.value)}
            />

            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <Button appearance="primary" onClick={handleSyncToExcel} disabled={loading}>
                    Load to Excel
                </Button>
                <Button appearance="secondary" onClick={handleSyncToPlatform} disabled={loading}>
                    Sync to Platform
                </Button>
            </div>

            {loading && <Spinner />}
            <p>{status}</p>

            <Button size="small" onClick={() => {
                setToken(null);
                localStorage.removeItem("auth_token");
            }}>Logout</Button>
        </div>
    );
};

export default App;
