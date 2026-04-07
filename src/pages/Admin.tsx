import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { ArrowLeft, Upload, Shield, Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { isAuthConfigured, loginRequest } from "@/config/auth";
import { acquireToken, fetchAuthMe, type AuthMeResponse } from "@/lib/auth";
import {
  fetchLanguages,
  fetchAdGroups,
  fetchVoiceAccessGroup,
  setVoiceAccessGroup,
  uploadVoice,
  type Language,
  type AdGroup,
} from "@/lib/api";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { instance } = useMsal();
  const isMsalAuthenticated = useIsAuthenticated();

  // Auth state
  const [authChecking, setAuthChecking] = useState(true);
  const [authMe, setAuthMe] = useState<AuthMeResponse | null>(null);

  // Voice upload state
  const [languages, setLanguages] = useState<Language[]>([]);
  const [voiceName, setVoiceName] = useState("");
  const [voiceLang, setVoiceLang] = useState("");
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // AD group state
  const [adGroups, setAdGroups] = useState<AdGroup[]>([]);
  const [currentGroup, setCurrentGroup] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [savingGroup, setSavingGroup] = useState(false);
  const [adLoading, setAdLoading] = useState(false);

  // Check auth on mount / when MSAL state changes
  const checkAuth = useCallback(async () => {
    if (!isAuthConfigured()) {
      setAuthChecking(false);
      return;
    }

    const token = await acquireToken(instance);
    if (!token) {
      setAuthMe(null);
      setAuthChecking(false);
      return;
    }

    try {
      const me = await fetchAuthMe(token);
      setAuthMe(me);
    } catch {
      setAuthMe(null);
    } finally {
      setAuthChecking(false);
    }
  }, [instance]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth, isMsalAuthenticated]);

  // Load data when admin is confirmed
  useEffect(() => {
    if (!authMe?.isAdmin) return;

    const loadData = async () => {
      const token = await acquireToken(instance);
      if (!token) return;

      // Fetch languages for voice upload
      fetchLanguages()
        .then((l) => {
          setLanguages(l);
          const danish = l.find((lang) => lang.id === "da");
          setVoiceLang(danish?.id ?? l[0]?.id ?? "");
        })
        .catch(() => {});

      // Fetch AD groups
      setAdLoading(true);
      try {
        const [groups, current] = await Promise.all([
          fetchAdGroups(token),
          fetchVoiceAccessGroup(token),
        ]);
        setAdGroups(groups);
        setCurrentGroup(current);
        setSelectedGroup(current);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Kunne ikke hente AD-grupper";
        toast({ title: "Fejl", description: message, variant: "destructive" });
      } finally {
        setAdLoading(false);
      }
    };

    loadData();
  }, [authMe?.isAdmin, instance, toast]);

  const handleLogin = async () => {
    try {
      await instance.loginPopup(loginRequest);
    } catch {
      toast({ title: "Fejl", description: "Login mislykkedes", variant: "destructive" });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validExts = [".wav", ".mp3", ".ogg", ".flac", ".m4a"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExts.includes(ext)) {
      toast({
        title: "Ugyldig filtype",
        description: `Tilladte filtyper: ${validExts.join(", ")}`,
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }
    setVoiceFile(file);
  };

  const handleUpload = async () => {
    if (!voiceName.trim() || !voiceLang || !voiceFile) {
      toast({ title: "Udfyld alle felter", variant: "destructive" });
      return;
    }

    const token = await acquireToken(instance);
    if (!token) return;

    setUploading(true);
    try {
      await uploadVoice(voiceName.trim(), voiceLang, voiceFile, token);
      toast({ title: "Stemme uploadet", description: `"${voiceName}" blev uploadet.` });
      setVoiceName("");
      setVoiceFile(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload fejlede";
      toast({ title: "Fejl", description: message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveGroup = async () => {
    const token = await acquireToken(instance);
    if (!token || !selectedGroup) return;

    setSavingGroup(true);
    try {
      await setVoiceAccessGroup(token, selectedGroup);
      setCurrentGroup(selectedGroup);
      toast({ title: "Gemt", description: "Stemmeadgangsgruppe opdateret." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Kunne ikke gemme";
      toast({ title: "Fejl", description: message, variant: "destructive" });
    } finally {
      setSavingGroup(false);
    }
  };

  // --- Render ---

  if (!isAuthConfigured()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              SSO er ikke konfigureret. Sæt <code>VITE_AZURE_CLIENT_ID</code> og{" "}
              <code>VITE_AZURE_TENANT_ID</code> som miljøvariabler.
            </p>
            <Button variant="outline" onClick={() => navigate("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Tilbage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!authMe?.isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Admin Panel</h2>
            <p className="text-muted-foreground">Log ind med din organisationskonto for at fortsætte.</p>
            <Button onClick={handleLogin}>Log ind</Button>
            <div>
              <Button variant="link" onClick={() => navigate("/")}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Tilbage til forsiden
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!authMe.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <Shield className="mx-auto h-12 w-12 text-destructive" />
            <h2 className="text-xl font-semibold">Ingen adgang</h2>
            <p className="text-muted-foreground">
              Du er logget ind som <strong>{authMe.user?.email ?? authMe.user?.name}</strong>, men har ikke administratorrettigheder.
            </p>
            <Button variant="outline" onClick={() => navigate("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Tilbage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-8 py-5">
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:text-primary-foreground/80" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">Admin Panel</h1>
            <p className="text-sm tracking-wide text-primary-foreground/70">
              {authMe.user?.name ?? authMe.user?.email}
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-16 space-y-8">
        {/* Voice Upload */}
        <Card className="shadow-lg">
          <CardHeader className="p-8 pb-2">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Upload className="h-6 w-6" />
              Upload stemme
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="voice-name">Stemmenavn</Label>
              <Input
                id="voice-name"
                placeholder="f.eks. Maria"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Sprog</Label>
              <Select value={voiceLang} onValueChange={setVoiceLang}>
                <SelectTrigger>
                  <SelectValue placeholder="Vælg sprog" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="voice-file">Lydfil</Label>
              <Input
                id="voice-file"
                type="file"
                accept=".wav,.mp3,.ogg,.flac,.m4a"
                onChange={handleFileChange}
              />
            </div>

            <Button onClick={handleUpload} disabled={uploading} className="w-full">
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {uploading ? "Uploader…" : "Upload"}
            </Button>
          </CardContent>
        </Card>

        {/* AD Group Access */}
        <Card className="shadow-lg">
          <CardHeader className="p-8 pb-2">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Shield className="h-6 w-6" />
              Stemmeadgang — AD-gruppe
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-4 space-y-4">
            {adLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {currentGroup && (
                  <p className="text-sm text-muted-foreground">
                    Nuværende gruppe:{" "}
                    <strong>{adGroups.find((g) => g.id === currentGroup)?.name ?? currentGroup}</strong>
                  </p>
                )}

                <div className="space-y-2">
                  <Label>Vælg AD-gruppe</Label>
                  <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vælg gruppe" />
                    </SelectTrigger>
                    <SelectContent>
                      {adGroups.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleSaveGroup}
                  disabled={savingGroup || !selectedGroup || selectedGroup === currentGroup}
                  className="w-full"
                >
                  {savingGroup ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {savingGroup ? "Gemmer…" : "Gem"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Admin;
