import { useNavigate } from "react-router-dom";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest } from "@/config/auth";
import { useEffect } from "react";
import rnLogo from "@/assets/rn-logo.png";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogIn } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    try {
      await instance.loginPopup(loginRequest);
      navigate("/", { replace: true });
    } catch (err) {
      console.error("[MSAL] Login failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-8 py-5">
          <img src={rnLogo} alt="Region Nordjylland" className="h-12 w-12 object-contain" />
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Regional Tekst-til-Tale Service
            </h1>
            <p className="text-sm tracking-wide text-primary-foreground/70">
              Region Nordjylland
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center space-y-8 max-w-md">
          <img src={rnLogo} alt="Region Nordjylland" className="h-24 w-24 object-contain mx-auto" />
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Velkommen
            </h2>
            <p className="text-muted-foreground text-lg">
              Regional Tekst-til-Tale Service
            </p>
          </div>
          <Button size="lg" onClick={handleLogin} className="gap-2">
            <LogIn className="h-5 w-5" />
            Log ind
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Landing;
