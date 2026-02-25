import { useState, useEffect, useRef } from "react";
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
  type Voice,
  type Language,
} from "@/lib/api";
import VoiceUploadModal from "@/components/VoiceUploadModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Volume2, Download, Upload, Loader2 } from "lucide-react";

const Index = () => {
  const { toast } = useToast();

  // Data from API
  const [voices, setVoices] = useState<Voice[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);

  // Form state with defaults
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("danish_voice");
  const [language, setLanguage] = useState("");
  const [format, setFormat] = useState("wav");
  const [textError, setTextError] = useState("");

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);

  // Modal
  const [uploadOpen, setUploadOpen] = useState(false);

  // Fetch voices & languages on mount
  useEffect(() => {
    fetchVoices()
      .then((v) => {
        setVoices(v);
        // Keep default "danish_voice" if it exists, otherwise first
        const hasDanish = v.some((item) => item.id === "danish_voice");
        if (!hasDanish && v.length > 0) setVoice(v[0].id);
      })
      .catch(() =>
        toast({
          title: "Fejl",
          description: "Kunne ikke hente stemmer fra serveren.",
          variant: "destructive",
        })
      );

    fetchLanguages()
      .then((l) => {
        setLanguages(l);
        if (l.length > 0) setLanguage(l[0].id);
      })
      .catch(() =>
        toast({
          title: "Fejl",
          description: "Kunne ikke hente sprog fra serveren.",
          variant: "destructive",
        })
      );
  }, []);

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
      const blob = await generateSpeech(text, voice, language, format);
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
    a.download = `tale.${format}`;
    a.click();
  };

  const refreshVoices = () => {
    fetchVoices()
      .then(setVoices)
      .catch(() => {});
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-6 py-4">
          <ThemeToggle />
          <div className="flex h-10 w-10 items-center justify-center rounded bg-primary-foreground/20 text-sm font-bold">
            RN
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Regional Tekst-til-Tale Service
            </h1>
            <p className="text-sm text-primary-foreground/70">
              Region Nordjylland
            </p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Volume2 className="h-5 w-5" />
              Generer tale fra tekst
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Text input */}
            <div className="space-y-2">
              <Label htmlFor="tts-text" className="text-base font-medium">
                Indtast din tekst her
              </Label>
              <Textarea
                id="tts-text"
                placeholder="Skriv eller indsæt den tekst du vil have læst op..."
                className="min-h-[140px] text-base"
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
            </div>

            {/* Settings row */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-sm">Stemme</Label>
                <Select value={voice} onValueChange={setVoice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg stemme" />
                  </SelectTrigger>
                  <SelectContent>
                    {voices.length > 0 ? (
                      voices.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="danish_voice">
                        danish_voice
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Sprog</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg sprog" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.length > 0 ? (
                      languages.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="da">Dansk</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Output format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wav">.wav</SelectItem>
                    <SelectItem value="mp3">.mp3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                onClick={() => setUploadOpen(true)}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload stemme
              </Button>
              <Button
                className="flex-1 text-base"
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
                <Progress value={progress} className="h-3" />
              </div>
            )}

            {/* Audio output */}
            {audioUrl && !generating && (
              <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
                <p className="text-sm font-medium">Din lydfil er klar:</p>
                <audio controls src={audioUrl} className="w-full" />
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download lydfil
                </Button>
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
