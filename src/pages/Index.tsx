import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import rnLogo from "@/assets/rn-logo.png";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { fetchVoices, fetchLanguages, type Voice, type Language } from "@/lib/api";
import { useAuth } from "@/useAuth";

import SingleGenerator from "@/components/SingleGenerator";
import BulkGenerator from "@/components/BulkGenerator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Volume2, Settings, Loader2 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isLoggedIn, isAdmin, loading: authLoading, restoreSession } = useAuth();

  const [voices, setVoices] = useState<Voice[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [languagesLoading, setLanguagesLoading] = useState(true);
  const [voicesError, setVoicesError] = useState("");
  const [languagesError, setLanguagesError] = useState("");
  const [voice, setVoice] = useState("");
  const [language, setLanguage] = useState("");
  const [speed, setSpeed] = useState(1.0);
  const [singleText, setSingleText] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [sessionChecked, setSessionChecked] = useState(false);

  // Try to restore session on mount
  useEffect(() => {
    restoreSession().then((data) => {
      setSessionChecked(true);
      if (!data?.isAuthenticated) {
        navigate("/login", { replace: true });
      }
    });
  }, [restoreSession, navigate]);

  useEffect(() => {
    if (!sessionChecked) return;
    if (!isLoggedIn) {
      navigate("/login", { replace: true });
      return;
    }

    fetchVoices()
      .then((v) => {
        setVoices(v);
        setVoice(v[0]?.id ?? "");
        setVoicesError("");
      })
      .catch((err) => {
        console.error("[TTS] fetchVoices failed:", err);
        setVoicesError(err.message || "Kunne ikke hente stemmer");
        toast({ title: "Fejl", description: err.message || "Kunne ikke hente stemmer fra serveren.", variant: "destructive" });
      })
      .finally(() => setVoicesLoading(false));

    fetchLanguages()
      .then((l) => {
        setLanguages(l);
        const danish = l.find((lang) => lang.id === "da");
        setLanguage(danish?.id ?? l[0]?.id ?? "");
        setLanguagesError("");
      })
      .catch((err) => {
        console.error("[TTS] fetchLanguages failed:", err);
        setLanguagesError(err.message || "Kunne ikke hente sprog");
        toast({ title: "Fejl", description: err.message || "Kunne ikke hente sprog fra serveren.", variant: "destructive" });
      })
      .finally(() => setLanguagesLoading(false));
  }, [sessionChecked, isLoggedIn, navigate, toast]);

  const sharedProps = {
    voices,
    languages,
    voicesLoading,
    languagesLoading,
    voicesError,
    languagesError,
    voice,
    setVoice,
    language,
    setLanguage,
    speed,
    setSpeed,
  };

  const singleProps = {
    ...sharedProps,
    text: singleText,
    setText: setSingleText,
  };

  const bulkProps = {
    ...sharedProps,
    bulkText,
    setBulkText,
  };

  if (!sessionChecked || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
          {isAdmin && (
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:text-primary-foreground/80" onClick={() => navigate("/admin")} title="Admin">
              <Settings className="h-5 w-5" />
            </Button>
          )}
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-16">
        <Card className="shadow-lg">
          <CardHeader className="p-8 pb-2">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Volume2 className="h-6 w-6" />
              Generer tale fra tekst
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            <Tabs defaultValue="single" className="w-full">
              <TabsList className="mb-6 w-full">
                <TabsTrigger value="single" className="flex-1">Enkelt</TabsTrigger>
                <TabsTrigger value="bulk" className="flex-1">Bulk</TabsTrigger>
              </TabsList>
              <TabsContent value="single">
                <SingleGenerator {...singleProps} />
              </TabsContent>
              <TabsContent value="bulk">
                <BulkGenerator {...bulkProps} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Index;
