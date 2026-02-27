import { useState, useEffect, useRef } from "react";
import rnLogo from "@/assets/rn-logo.png";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  fetchVoices,
  fetchLanguages,
  generateSpeech,
  queryLlm,
  type Voice,
  type Language,
} from "@/lib/api";
import VoiceUploadModal from "@/components/VoiceUploadModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Volume2, Download, Upload, Loader2, ChevronDown, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Index = () => {
  const { toast } = useToast();

  // Data from API
  const [voices, setVoices] = useState<Voice[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [languagesLoading, setLanguagesLoading] = useState(true);
  const [voicesError, setVoicesError] = useState("");
  const [languagesError, setLanguagesError] = useState("");

  // Form state with defaults
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("");
  const [language, setLanguage] = useState("");
  const [textError, setTextError] = useState("");

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);

  const [downloadFormat, setDownloadFormat] = useState("wav");

  // Modal
  const [uploadOpen, setUploadOpen] = useState(false);

  // Fetch voices & languages on mount
  useEffect(() => {
    fetchVoices()
      .then((v) => {
        setVoices(v);
        setVoice(v[0]?.id ?? "");
        setVoicesError("");
      })
      .catch((err) => {
        console.error("[TTS] fetchVoices failed:", err);
        setVoicesError(err.message || "Kunne ikke hente stemmer");
        toast({
          title: "Fejl",
          description: err.message || "Kunne ikke hente stemmer fra serveren.",
          variant: "destructive",
        });
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
        toast({
          title: "Fejl",
          description: err.message || "Kunne ikke hente sprog fra serveren.",
          variant: "destructive",
        });
      })
      .finally(() => setLanguagesLoading(false));
  }, []);

  const handleOptimize = async () => {
    if (!text.trim()) return;
    setOptimizing(true);
    try {
      const optimized = await queryLlm(text);
      setText(optimized);
      toast({ title: "Tekst optimeret", description: "Din tekst er blevet optimeret til tale." });
    } catch {
      toast({ title: "Fejl", description: "Kunne ikke optimere teksten. Prøv igen.", variant: "destructive" });
    } finally {
      setOptimizing(false);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      setTextError("Du skal indtaste tekst før du kan generere en lydfil.");
      return;
    }
    setTextError("");

    // Clean up previous audio
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    setGenerating(true);
    setProgress(10);

    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 8, 90));
    }, 300);

    try {
      const blob = await generateSpeech(text, voice, language);
      clearInterval(progressInterval);
      setProgress(100);
      audioBlobRef.current = blob;
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      toast({ title: "Færdig!", description: "Din lydfil er klar." });
    } catch {
      clearInterval(progressInterval);
      toast({
        title: "Fejl",
        description: "Noget gik galt. Prøv igen.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `tale.${downloadFormat}`;
    a.click();
  };

  const refreshVoices = (voiceName?: string) => {
    fetchVoices()
      .then((v) => {
        setVoices(v);
        if (voiceName) {
          const match = v.find((voice) => voice.name === voiceName);
          if (match) setVoice(match.id);
        }
      })
      .catch(() => {});
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-2xl items-center gap-4 px-8 py-5">
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

      {/* Main content */}
      <main className="mx-auto max-w-2xl px-4 py-16">
        <Card className="shadow-lg">
          <CardHeader className="p-8 pb-2">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Volume2 className="h-6 w-6" />
              Generer tale fra tekst
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 p-8 pt-6">
            {/* Text input */}
            <div className="space-y-2">
              <Label htmlFor="tts-text" className="text-base font-medium">
                Indtast din tekst her
              </Label>
              <Textarea
                id="tts-text"
                placeholder="Skriv eller indsæt den tekst du vil have læst op..."
                className="min-h-[180px] text-lg p-4"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (e.target.value.trim()) setTextError("");
                }}
              />
              {textError && (
                <p className="text-sm font-medium text-destructive">
                  {textError}
                </p>
              )}
              <div className="flex justify-end">
                <button
                  onClick={handleOptimize}
                  disabled={!text.trim() || optimizing || generating}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:from-violet-600 hover:to-purple-700 disabled:pointer-events-none disabled:opacity-50"
                >
                  {optimizing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {optimizing ? "Optimerer..." : "AI Optimer tekst"}
                </button>
              </div>
            </div>

            {/* Settings row */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-base font-medium">Stemme</Label>
                <Select value={voice} onValueChange={setVoice} disabled={voicesLoading || voices.length === 0}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder={voicesLoading ? "Henter stemmer…" : "Vælg stemme"} />
                  </SelectTrigger>
                  <SelectContent>
                    {voices.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {voicesError && (
                  <p className="text-xs text-destructive">{voicesError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-base font-medium">Sprog</Label>
                <Select value={language} onValueChange={setLanguage} disabled={languagesLoading || languages.length === 0}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder={languagesLoading ? "Henter sprog…" : "Vælg sprog"} />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {languagesError && (
                  <p className="text-xs text-destructive">{languagesError}</p>
                )}
              </div>

            </div>

            {/* Actions */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setUploadOpen(true)}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload stemme
              </Button>
              <Button
                className="flex-1 h-14 text-lg rounded-xl"
                size="lg"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Volume2 className="mr-2 h-5 w-5" />
                )}
                {generating ? "Genererer..." : "Generer lydfil"}
              </Button>
            </div>

            {/* Progress bar */}
            {generating && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Behandler din tekst...
                </p>
                <Progress value={progress} className="h-4" />
              </div>
            )}

            {/* Audio output */}
            {audioUrl && !generating && (
              <div className="space-y-4 rounded-xl border bg-muted/50 p-6">
                <p className="text-base font-medium">Din lydfil er klar:</p>
                <audio controls src={audioUrl} className="w-full" />
                <div className="flex items-center gap-0">
                  <Button variant="outline" size="lg" onClick={handleDownload} className="rounded-r-none">
                    <Download className="mr-2 h-4 w-4" />
                    Download .{downloadFormat}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="lg" className="rounded-l-none border-l-0 px-3">
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {["wav", "mp3", "au"].map((fmt) => (
                        <DropdownMenuItem key={fmt} onClick={() => setDownloadFormat(fmt)}>
                          .{fmt} {fmt === downloadFormat && "✓"}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Voice Upload Modal */}
      <VoiceUploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        languages={languages}
        onSuccess={refreshVoices}
      />
    </div>
  );
};

export default Index;
