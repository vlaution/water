import { useState, useEffect } from 'react';
import { api } from './config/api';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { AnalystDashboard } from './pages/AnalystDashboard';
import { AssociateDashboard } from './pages/AssociateDashboard';
import { ManagerDashboard } from './pages/ManagerDashboard';
import { PartnerDashboard } from './pages/PartnerDashboard';
import { ComplianceDashboard } from './pages/ComplianceDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { FileUpload } from './components/FileUpload';
import { SheetMapping } from './components/SheetMapping';
import { ResultsDashboard } from './components/ResultsDashboard';
import { ModeSelection } from './components/ModeSelection';
import { ManualEntryForm } from './components/ManualEntryForm';
import { RecentRuns } from './components/RecentRuns';
import { DashboardHome } from './components/DashboardHome';
import { PerformanceDashboard } from './components/admin/PerformanceDashboard';
import { AuditLogViewer } from './components/admin/AuditLogViewer';
import { SystemHealthDashboard } from './components/admin/SystemHealthDashboard';
import { FundSimulator } from './components/analytics/FundSimulator';
import { DealSourcingDashboard } from './components/analytics/DealSourcingDashboard';
import { DebtMarketDashboard } from './components/analytics/DebtMarketDashboard';
import { PermissionGuard } from './components/common/PermissionGuard';
import { RequirePermission } from './components/common/RequirePermission';
import { ThemeToggle } from './components/common/ThemeToggle';
import { Permissions } from './config/permissions';
import { GlobalAssumptionsPanel } from './components/dashboard/GlobalAssumptionsPanel';
import { Globe } from 'lucide-react';
import { UserPreferencesProvider } from './context/UserPreferencesContext';
import { GlobalConfigProvider } from './context/GlobalConfigContext';
import { RiskDashboard } from './pages/RiskDashboard';
import { SecretsModal } from './components/modals/SecretsModal';
import { ToastProvider, useToast } from './context/ToastContext';
import { RealTimeProvider } from './context/RealTimeContext';
import { RealTimeAlerts } from './components/common/RealTimeAlerts';
import { ComparisonPage } from './pages/ComparisonPage';
import { SensitivityPage } from './pages/SensitivityPage';


import { CommandController } from './components/CommandPalette/CommandController';
import { BackendSearchController } from './components/CommandPalette/BackendSearchController';
import { CommandRegistryProvider } from './context/CommandRegistryContext';
import { CommandPalette } from './components/System/CommandPalette';

const ProtectedApp = () => {
  const { user, loading, token, logout } = useAuth();
  const { showToast } = useToast(); // Use the hook
  const [step, setStep] = useState<'mode-selection' | 'upload' | 'mapping' | 'manual-entry' | 'dashboard' | 'dashboard-home' | 'risk-dashboard' | 'fund-simulator' | 'deal-sourcing' | 'debt-markets'>('mode-selection');
  const [workbookData, setWorkbookData] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGlobalSettingsOpen, setIsGlobalSettingsOpen] = useState(false);
  const [isSecretsModalOpen, setIsSecretsModalOpen] = useState(false); // New State

  const location = useLocation();

  useEffect(() => {
    if (location.state && (location.state as any).setStep) {
      setStep((location.state as any).setStep);
      // Clear state to prevent loop if we add more complex logic, though separate routes handle this well
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleModeSelect = (mode: 'upload' | 'manual' | 'dashboard') => {
    if (mode === 'upload') {
      setStep('upload');
    } else if (mode === 'manual') {
      setStep('manual-entry');
    } else {
      setStep('dashboard-home');
    }
  };

  const handleUploadSuccess = (data: any) => {
    setWorkbookData(data);
    setStep('mapping');
    showToast('File uploaded successfully', 'success');
  };

  const handleMappingConfirm = async (mappings: Record<string, string>) => {
    if (!workbookData?.file_id) {
      showToast('No file ID found. Please upload again.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(api.url(`/run/${workbookData.file_id}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ mappings }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.type === 'validation_error') {
          const messages = errorData.details.map((d: any) => `${d.severity.toUpperCase()}: ${d.message}`).join('\n');
          showToast(`Validation Errors: ${messages}`, 'error');
          return;
        }
        throw new Error('Valuation run failed');
      }

      const data = await response.json();

      // Check for warnings in successful response
      if (data.validation_warnings && data.validation_warnings.length > 0) {
        showToast(`Valuation completed with warnings`, 'warning');
      } else {
        showToast('Valuation completed successfully', 'success');
      }

      setResults(data);
      setStep('dashboard');
    } catch (error) {
      console.error('Error running valuation:', error);
      showToast('Failed to calculate valuation. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = async (valuationInput: any) => {
    setIsLoading(true);
    try {
      const response = await fetch(api.url('/calculate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(valuationInput),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        if (errorData.type === 'validation_error') {
          const messages = errorData.details.map((d: any) => `${d.severity.toUpperCase()}: ${d.message}`).join('\n');
          showToast(`Validation Errors: ${messages}`, 'error');
          return;
        }
        // Handle specific 500/400 errors cleanly
        throw new Error(errorData.detail || 'Valuation calculation failed');
      }

      const data = await response.json();

      if (data.results && data.results.validation_warnings && data.results.validation_warnings.length > 0) {
        showToast(`Valuation completed with warnings`, 'warning');
      } else {
        showToast('Valuation computed successfully', 'success');
      }

      // The /calculate endpoint returns the results directly (including run_id), not wrapped in a 'results' property
      setResults(data);
      setStep('dashboard');
    } catch (error) {
      console.error('Error during manual valuation:', error);
      showToast(`${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRun = async (runId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(api.url(`/runs/${runId}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch run');
      }
      const data = await response.json();
      // Inject the run ID into the results object so it's available for the dashboard
      setResults({ ...data.results, run_id: data.id });
      setStep('dashboard');
    } catch (error) {
      console.error('Error loading run:', error);
      showToast('Failed to load run. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <CommandController setStep={setStep} />
      <BackendSearchController setStep={setStep} />
      <div className="flex">
        {/* Sidebar */}
        {step !== 'mode-selection' && (
          <aside className="w-80 min-h-screen bg-white/60 backdrop-blur-xl border-r border-white/20 dark:bg-gray-900/60 dark:border-white/10 p-6 shadow-sidebar z-50 transition-all duration-300">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-system-blue rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Valuation</h1>
              </div>
              <ThemeToggle />
            </div>
            <div className="flex flex-col gap-2">
              <PermissionGuard permission={Permissions.CREATE_VALUATION}>
                <button
                  onClick={() => setStep('mode-selection')}
                  className="glass-button w-full flex items-center  justify-center gap-2 text-sm"
                >
                  <span>←</span> New Valuation
                </button>
              </PermissionGuard>

              <button
                onClick={() => setStep('risk-dashboard')}
                className={`glass-button w-full flex items-center justify-center gap-2 text-sm ${step === 'risk-dashboard' ? 'nav-item-active' : ''}`}
              >
                Risk Management
              </button>

              <button
                onClick={() => setStep('fund-simulator')}
                className={`glass-button w-full flex items-center justify-center gap-2 text-sm ${step === 'fund-simulator' ? 'nav-item-active' : ''}`}
              >
                Fund Simulator
              </button>

              <button
                onClick={() => setStep('deal-sourcing')}
                className={`glass-button w-full flex items-center justify-center gap-2 text-sm ${step === 'deal-sourcing' ? 'nav-item-active' : ''}`}
              >
                Deal Sourcing
              </button>

              <button
                onClick={() => setStep('debt-markets')}
                className={`glass-button w-full flex items-center justify-center gap-2 text-sm ${step === 'debt-markets' ? 'nav-item-active' : ''}`}
              >
                Debt Markets
              </button>

              <PermissionGuard permission={Permissions.VIEW_ANALYTICS}>
                <button
                  onClick={() => window.location.href = '/admin/performance'}
                  className="glass-button w-full flex items-center justify-center gap-2 text-sm"
                >
                  Performance
                </button>
              </PermissionGuard>

              <PermissionGuard permission={Permissions.VIEW_AUDIT_LOGS}>
                <button
                  onClick={() => window.location.href = '/admin/audit'}
                  className="glass-button w-full flex items-center justify-center gap-2 text-sm"
                >
                  Audit Logs
                </button>
              </PermissionGuard>

              <PermissionGuard permission={Permissions.CONFIGURE_SYSTEM}>
                <button
                  onClick={() => window.location.href = '/admin/health'}
                  className="glass-button w-full flex items-center justify-center gap-2 text-sm"
                >
                  System Health
                </button>
              </PermissionGuard>

              <button
                onClick={logout}
                className="glass-button w-full flex items-center justify-center gap-2 text-sm bg-red-50 hover:bg-red-100"
              >
                Logout ({user.name})
              </button>

            </div>

            <div className="mt-6 border-t border-gray-200/50 pt-6">
              <button
                onClick={() => setIsGlobalSettingsOpen(true)}
                className="glass-button w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-system-blue transition-colors"
              >
                <Globe size={16} />
                Global Assumptions
              </button>
              <button
                onClick={() => setIsSecretsModalOpen(true)}
                className="glass-button w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-system-blue transition-colors mt-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                API Vault
              </button>
            </div>

            <RecentRuns onSelectRun={handleSelectRun} token={token} />
          </aside>
        )}

        {/* Main Content */}
        <main className={`flex-1 p-8 ${step === 'mode-selection' ? 'max-w-6xl mx-auto' : ''}`}>
          {step === 'mode-selection' && (
            <header className="mb-12 flex items-center justify-between animate-fade-in-up">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-system-blue rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Valuation</h1>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={logout}
                  className="glass-button text-sm"
                >
                  Logout ({user.name})
                </button>
                <ThemeToggle />
              </div>
            </header>
          )}

          {step === 'mode-selection' && <ModeSelection onSelectMode={handleModeSelect} />}
          {step === 'upload' && <FileUpload onUploadSuccess={handleUploadSuccess} />}
          {step === 'mapping' && (
            <SheetMapping
              workbookData={workbookData}
              onConfirm={handleMappingConfirm}
              isLoading={isLoading}
            />
          )}
          {step === 'manual-entry' && (
            <ManualEntryForm onSubmit={handleManualSubmit} isLoading={isLoading} />
          )}
          {step === 'dashboard' && <ResultsDashboard results={results} runId={results?.run_id} />}
          {step === 'dashboard-home' && (
            user?.role === 'analyst' ? (
              <AnalystDashboard onCreateValuation={() => setStep('mode-selection')} />
            ) : user?.role === 'associate' ? (
              <AssociateDashboard />
            ) : user?.role === 'manager' ? (
              <ManagerDashboard />
            ) : user?.role === 'partner' ? (
              <PartnerDashboard />
            ) : user?.role === 'compliance' ? (
              <ComplianceDashboard />
            ) : user?.role === 'admin' ? (
              <AdminDashboard />
            ) : (
              <DashboardHome
                onSelectRun={handleSelectRun}
                token={token}
                onOpenGlobalSettings={() => setIsGlobalSettingsOpen(true)}
              />
            )
          )}
          {step === 'risk-dashboard' && <RiskDashboard />}
          {step === 'fund-simulator' && <FundSimulator />}
          {step === 'deal-sourcing' && <DealSourcingDashboard />}
          {step === 'debt-markets' && <DebtMarketDashboard />}
        </main>
        <GlobalAssumptionsPanel isOpen={isGlobalSettingsOpen} onClose={() => setIsGlobalSettingsOpen(false)} />
        <SecretsModal isOpen={isSecretsModalOpen} onClose={() => setIsSecretsModalOpen(false)} /> {/* Render User Modal */}
      </div>
    </div >
  );
}



function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UserPreferencesProvider>
          <ToastProvider>
            <RealTimeProvider>
              <GlobalConfigProvider>
                <CommandRegistryProvider>
                  <CommandPalette />
                  <RealTimeAlerts />
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/compare" element={<ComparisonPage />} />
                    <Route path="/sensitivity" element={<SensitivityPage />} />
                    <Route path="/admin/performance" element={
                      <RequirePermission permission={Permissions.VIEW_ANALYTICS}>
                        <PerformanceDashboard />
                      </RequirePermission>
                    } />
                    <Route path="/admin/audit" element={
                      <RequirePermission permission={Permissions.VIEW_AUDIT_LOGS}>
                        <AuditLogViewer />
                      </RequirePermission>
                    } />
                    <Route path="/admin/health" element={
                      <RequirePermission permission={Permissions.CONFIGURE_SYSTEM}>
                        <SystemHealthDashboard />
                      </RequirePermission>
                    } />
                    <Route path="/*" element={<ProtectedApp />} />
                  </Routes>
                </CommandRegistryProvider>
              </GlobalConfigProvider>
            </RealTimeProvider>
          </ToastProvider>
        </UserPreferencesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
