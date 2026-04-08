import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "@/config/auth";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [msalInstance, setMsalInstance] = useState<PublicClientApplication | null>(null);
  const [cryptoError, setCryptoError] = useState(false);

  useEffect(() => {
    if (!window.crypto?.subtle) {
      setCryptoError(true);
      return;
    }
    try {
      const instance = new PublicClientApplication(msalConfig);
      instance.initialize().then(() => {
        setMsalInstance(instance);
      });
    } catch (err) {
      console.error("[MSAL] Init failed:", err);
      setCryptoError(true);
    }
  }, []);

  if (cryptoError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold text-destructive">Kryptering ikke tilgængelig</h1>
          <p className="text-muted-foreground">
            Browseren understøtter ikke den nødvendige kryptering. Prøv en anden browser eller åbn siden direkte (ikke i en iframe).
          </p>
        </div>
      </div>
    );
  }

  if (!msalInstance) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <MsalProvider instance={msalInstance}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Landing />} />
              <Route path="/" element={<Index />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </MsalProvider>
  );
};

export default App;
