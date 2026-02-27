import { useState, useRef } from "react";
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
  generateSpeech,
  queryLlm,
  type Voice,
  type Language,
} from "@/lib/api";
import { Volume2, Download, Upload, Loader2, ChevronDown, Sparkles, Gauge } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SingleGeneratorProps {
  voices: Voice[];
  languages: Language[];
  voicesLoading: boolean;
  languagesLoading: boolean;
  voicesError: string;
  languagesError: string;
  voice: string;
  setVoice: (v: string) => void;
  language: string;
  setLanguage: (l: string) => void;
  speed: number;
  setSpeed: (s: number) => void;
  onUploadClick: () => void;
}

const SingleGenerator = ({
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
  onUploadClick,
}: SingleGeneratorProps) => {
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [textError, setTextError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeProgress, setOptimizeProgress] = useState(0);
  const [progress, setProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);
  const [downloadFormat, setDownloadFormat] = useState("wav");

  const handleOptimize = async () => {
    if (!text.trim()) return;
    setOptimizing(true);
    setOptimizeProgress(10);
    const interval = setInterval(() => {
      setOptimizeProgress((p) => Math.min(p + 5, 90));
    }, 200);
    try {
      const optimized = await queryLlm(text);
      clearInterval(interval);
      setOptimizeProgress(100);
      setText(optimized);
      toast({ title: "Tekst optimeret", description: "Din tekst er blevet optimeret til tale." });
    } catch {
      clearInterval(interval);
      toast({ title: "Fejl", description: "Kunne ikke optimere teksten. Prøv igen.", variant: "destructive" });
    } finally {
      setTimeout(() => {
        setOptimizing(false);
        setOptimizeProgress(0);
      }, 500);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      setTextError("Du skal indtaste tekst før du kan generere en lydfil.");
      return;
    }
    setTextError("");
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
      const blob = await generateSpeech(text, voice, language, speed);
      clearInterval(progressInterval);
      setProgress(100);
      audioBlobRef.current = blob;
      setAudioUrl(URL.createObjectURL(blob));
      toast({ title: "Færdig!", description: "Din lydfil er klar." });
    } catch {
      clearInterval(progressInterval);
      toast({ title: "Fejl", description: "Noget gik galt. Prøv igen.", variant: "destructive" });
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

  return (
    <div className="space-y-8">
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
          <p className="text-sm font-medium text-destructive">{textError}</p>
        )}
        <div className="space-y-2">
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
          {optimizing && (
            <Progress value={optimizeProgress} className="h-2" />
          )}
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
                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {voicesError && <p className="text-xs text-destructive">{voicesError}</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-base font-medium">Sprog</Label>
          <Select value={language} onValueChange={setLanguage} disabled={languagesLoading || languages.length === 0}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder={languagesLoading ? "Henter sprog…" : "Vælg sprog"} />
            </SelectTrigger>
            <SelectContent>
              {languages.map((l) => (
                <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {languagesError && <p className="text-xs text-destructive">{languagesError}</p>}
        </div>
      </div>

      {/* Speed slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            Hastighed
          </Label>
          <span className="text-sm font-semibold tabular-nums">{speed.toFixed(2)}x</span>
        </div>
        <Slider
          min={0}
          max={2}
          step={0.01}
          value={[speed]}
          onValueChange={([v]) => setSpeed(Math.max(0.5, v))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0</span>
          <span>1.0x</span>
          <span>2.0x</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <Button variant="outline" size="lg" onClick={onUploadClick}>
          <Upload className="mr-2 h-4 w-4" />
          Upload stemme
        </Button>
        <Button
          className="flex-1 h-14 text-lg rounded-xl"
          size="lg"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Volume2 className="mr-2 h-5 w-5" />}
          {generating ? "Genererer..." : "Generer lydfil"}
        </Button>
      </div>

      {/* Progress bar */}
      {generating && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Behandler din tekst...</p>
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
    </div>
  );
};

export default SingleGenerator;
