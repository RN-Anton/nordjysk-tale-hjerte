import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { msalInstance, getLoginRequest } from "@/authConfig";
import { AUTH_BASE_URL } from "@/config/config";

export default function Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log("[Callback] Handling redirect response...");
        await msalInstance.handleRedirectPromise();
        console.log("[Callback] Redirect handled successfully");

        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
          const loginRequest = getLoginRequest();
          const result = await msalInstance.acquireTokenSilent({
            ...loginRequest,
            account: accounts[0],
          });

          const authResponse = await fetch(`${AUTH_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${result.accessToken}` },
          });

          const data = await authResponse.json();
          console.log("[Callback] Auth result:", data);

          if (data.isAuthenticated) {
            sessionStorage.setItem("auth_restored", "true");
            sessionStorage.setItem("auth_user", JSON.stringify(data.user));
            sessionStorage.setItem("auth_is_admin", String(data.isAdmin));
            navigate("/", { replace: true });
          } else {
            navigate("/login", { replace: true });
          }
        } else {
          navigate("/login", { replace: true });
        }
      } catch (err) {
        console.error("[Callback] Auth failed:", err);
        navigate("/login", { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Logging in...</p>
    </div>
  );
}