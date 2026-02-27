import { useState, useRef, useCallback } from "react";
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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  generateSpeech,
  queryLlm,
  type Voice,
  type Language,
} from "@/lib/api";
import {
  Volume2,
  Download,
  Upload,
  Loader2,
  ChevronDown,
  Sparkles,
  FileText,
  Package,
  Play,
  Trash2,
  Gauge,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import JSZip from "jszip";

interface BulkGeneratorProps {
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

interface BulkLine {
  id: string;
  text: string;
  optimizedText?: string;
  status: "pending" | "optimizing" | "generating" | "done" | "error";
  progress: number;
  audioUrl?: string;
  audioBlob?: Blob;
  error?: string;
}

function parseLines(raw: string): string[] {
  // Split by double newlines (empty line separator)
  return raw
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function parseFile(file: File): Promise<string[]> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "txt") {
    const text = await file.text();
    return parseLines(text);
  }

  if (ext === "csv") {
    const text = await file.text();
    // Each non-empty row is a line
    return text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (ext === "docx") {
    const mammoth = await import("mammoth");
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.default.extractRawText({ arrayBuffer });
    return parseLines(result.value);
  }

  throw new Error(`Filtype .${ext} understøttes ikke. Brug .txt, .csv eller .docx.`);
}

let lineIdCounter = 0;

const BulkGenerator = ({
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
}: BulkGeneratorProps) => {
  const { toast } = useToast();
  const [bulkText, setBulkText] = useState("");
  const [lines, setLines] = useState<BulkLine[]>([]);
  const [downloadFormat, setDownloadFormat] = useState("wav");
  const [isProcessing, setIsProcessing] = useState(false);
  const [optimizingAll, setOptimizingAll] = useState(false);
  const [optimizeAllProgress, setOptimizeAllProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLines = useCallback((texts: string[]) => {
    const newLines: BulkLine[] = texts.map((text) => ({
      id: `line-${++lineIdCounter}`,
      text,
      status: "pending",
      progress: 0,
    }));
    setLines((prev) => [...prev, ...newLines]);
  }, []);

  const handleParseText = () => {
    const parsed = parseLines(bulkText);
    if (parsed.length === 0) {
      toast({ title: "Ingen linjer", description: "Adskil voicelines med en tom linje.", variant: "destructive" });
      return;
    }
    addLines(parsed);
    setBulkText("");
    toast({ title: `${parsed.length} linjer tilføjet`, description: "Klar til generering." });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseFile(file);
      if (parsed.length === 0) {
        toast({ title: "Tom fil", description: "Filen indeholdt ingen voicelines.", variant: "destructive" });
        return;
      }
      addLines(parsed);
      toast({ title: `${parsed.length} linjer fra fil`, description: `Importeret fra ${file.name}.` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Kunne ikke læse filen.";
      toast({ title: "Fejl", description: msg, variant: "destructive" });
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeLine = (id: string) => {
    setLines((prev) => {
      const line = prev.find((l) => l.id === id);
      if (line?.audioUrl) URL.revokeObjectURL(line.audioUrl);
      return prev.filter((l) => l.id !== id);
    });
  };

  const handleOptimizeAll = async () => {
    const pending = lines.filter((l) => l.status === "pending" || l.status === "done");
    if (pending.length === 0) return;
    setOptimizingAll(true);
    setOptimizeAllProgress(0);

    for (let i = 0; i < pending.length; i++) {
      const line = pending[i];
      setLines((prev) =>
        prev.map((l) => (l.id === line.id ? { ...l, status: "optimizing" as const, progress: 50 } : l))
      );
      try {
        const optimized = await queryLlm(line.text);
        setLines((prev) =>
          prev.map((l) =>
            l.id === line.id
              ? { ...l, text: optimized, optimizedText: optimized, status: "pending" as const, progress: 0 }
              : l
          )
        );
      } catch {
        setLines((prev) =>
          prev.map((l) => (l.id === line.id ? { ...l, status: "pending" as const, progress: 0 } : l))
        );
      }
      setOptimizeAllProgress(Math.round(((i + 1) / pending.length) * 100));
    }

    setOptimizingAll(false);
    toast({ title: "Optimering færdig", description: "Alle linjer er blevet optimeret." });
  };

  const handleGenerateAll = async () => {
    const toGenerate = lines.filter((l) => l.status === "pending");
    if (toGenerate.length === 0) return;
    setIsProcessing(true);

    for (const line of toGenerate) {
      setLines((prev) =>
        prev.map((l) => (l.id === line.id ? { ...l, status: "generating" as const, progress: 10 } : l))
      );

      // Simulate progress
      const interval = setInterval(() => {
        setLines((prev) =>
          prev.map((l) =>
            l.id === line.id && l.status === "generating"
              ? { ...l, progress: Math.min(l.progress + 8, 90) }
              : l
          )
        );
      }, 300);

      try {
        const blob = await generateSpeech(line.text, voice, language, speed);
        clearInterval(interval);
        const url = URL.createObjectURL(blob);
        setLines((prev) =>
          prev.map((l) =>
            l.id === line.id
              ? { ...l, status: "done" as const, progress: 100, audioUrl: url, audioBlob: blob }
              : l
          )
        );
      } catch {
        clearInterval(interval);
        setLines((prev) =>
          prev.map((l) =>
            l.id === line.id
              ? { ...l, status: "error" as const, progress: 0, error: "Generering fejlede" }
              : l
          )
        );
      }
    }

    setIsProcessing(false);
    toast({ title: "Bulk-generering færdig!", description: "Alle lydfiler er klar." });
  };

  const handleDownloadSingle = (line: BulkLine) => {
    if (!line.audioUrl) return;
    const a = document.createElement("a");
    a.href = line.audioUrl;
    const idx = lines.indexOf(line) + 1;
    a.download = `tale_${idx}.${downloadFormat}`;
    a.click();
  };

  const handleDownloadZip = async () => {
    const done = lines.filter((l) => l.status === "done" && l.audioBlob);
    if (done.length === 0) return;

    const zip = new JSZip();
    done.forEach((line, i) => {
      if (line.audioBlob) {
        zip.file(`tale_${i + 1}.${downloadFormat}`, line.audioBlob);
      }
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `tale_bulk.zip`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const doneCount = lines.filter((l) => l.status === "done").length;

  return (
    <div className="space-y-8">
      {/* Bulk text input */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Indsæt voicelines</Label>
        <p className="text-sm text-muted-foreground">
          Adskil hver voiceline med en <strong>tom linje</strong>.
        </p>
        <Textarea
          placeholder={"Velkommen til Region Nordjylland.\nVi glæder os til at hjælpe dig.\n\nDin tid er booket til mandag.\nHusk at medbringe dit sundhedskort.\n\nTak fordi du kontaktede os."}
          className="min-h-[220px] text-base p-4"
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
        />
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleParseText} disabled={!bulkText.trim()}>
            <FileText className="mr-2 h-4 w-4" />
            Tilføj linjer
          </Button>
          <div>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv,.docx"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Upload fil (.txt, .csv, .docx)
            </Button>
          </div>
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
          min={0.5}
          max={2}
          step={0.01}
          value={[speed]}
          onValueChange={([v]) => setSpeed(v)}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0.5x</span>
          <span>1.0x</span>
          <span>2.0x</span>
        </div>
      </div>

      {/* Queue */}
      {lines.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">
              Voicelines ({lines.length}) — {doneCount} færdige
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { lines.forEach((l) => { if (l.audioUrl) URL.revokeObjectURL(l.audioUrl); }); setLines([]); }}>
                Ryd alle
              </Button>
            </div>
          </div>

          {/* Bulk actions */}
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="lg" onClick={onUploadClick}>
              <Upload className="mr-2 h-4 w-4" />
              Upload stemme
            </Button>
            <button
              onClick={handleOptimizeAll}
              disabled={optimizingAll || isProcessing || lines.filter((l) => l.status === "pending" || l.status === "done").length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-violet-600 hover:to-purple-700 disabled:pointer-events-none disabled:opacity-50"
            >
              {optimizingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {optimizingAll ? "Optimerer..." : "AI Optimer alle"}
            </button>
            <Button
              className="flex-1 h-12 text-base rounded-xl"
              size="lg"
              onClick={handleGenerateAll}
              disabled={isProcessing || lines.filter((l) => l.status === "pending").length === 0}
            >
              {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Volume2 className="mr-2 h-5 w-5" />}
              {isProcessing ? "Genererer..." : "Generer alle"}
            </Button>
          </div>

          {/* Optimize all progress */}
          {optimizingAll && (
            <Progress value={optimizeAllProgress} className="h-2" />
          )}

          {/* Line items */}
          <div className="space-y-3">
            {lines.map((line, idx) => (
              <div key={line.id} className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Linje {idx + 1}</p>
                    <p className="text-sm leading-relaxed break-words">{line.text}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {line.status === "done" && (
                      <span className="text-xs font-medium text-green-600 dark:text-green-400 mr-1">✓</span>
                    )}
                    {line.status === "error" && (
                      <span className="text-xs font-medium text-destructive mr-1">✗</span>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeLine(line.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Progress */}
                {(line.status === "generating" || line.status === "optimizing") && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {line.status === "optimizing" ? "Optimerer..." : "Genererer..."}
                    </p>
                    <Progress value={line.progress} className="h-2" />
                  </div>
                )}

                {/* Audio */}
                {line.status === "done" && line.audioUrl && (
                  <div className="space-y-2">
                    <audio controls src={line.audioUrl} className="w-full h-10" />
                    <Button variant="outline" size="sm" onClick={() => handleDownloadSingle(line)}>
                      <Download className="mr-2 h-3.5 w-3.5" />
                      Download .{downloadFormat}
                    </Button>
                  </div>
                )}

                {line.status === "error" && (
                  <p className="text-xs text-destructive">{line.error}</p>
                )}
              </div>
            ))}
          </div>

          {/* Bulk download */}
          {doneCount > 0 && (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center gap-0">
                <Button size="lg" onClick={handleDownloadZip} className="rounded-r-none">
                  <Package className="mr-2 h-4 w-4" />
                  Download alle som .zip
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="lg" className="rounded-l-none border-l border-primary-foreground/20 px-3">
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
              <p className="text-sm text-muted-foreground">{doneCount} fil(er) klar</p>
            </div>
          )}
        </div>
      )}

      {/* Empty state when no lines added */}
      {lines.length === 0 && (
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button variant="outline" size="lg" onClick={onUploadClick}>
            <Upload className="mr-2 h-4 w-4" />
            Upload stemme
          </Button>
        </div>
      )}
    </div>
  );
};

export default BulkGenerator;
