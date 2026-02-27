import { useState, useEffect } from "react";
import rnLogo from "@/assets/rn-logo.png";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { fetchVoices, fetchLanguages, type Voice, type Language } from "@/lib/api";
import VoiceUploadModal from "@/components/VoiceUploadModal";
import SingleGenerator from "@/components/SingleGenerator";
import BulkGenerator from "@/components/BulkGenerator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Volume2 } from "lucide-react";

const Index = () => {
  const { toast } = useToast();

  const [voices, setVoices] = useState<Voice[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [languagesLoading, setLanguagesLoading] = useState(true);
  const [voicesError, setVoicesError] = useState("");
  const [languagesError, setLanguagesError] = useState("");
  const [voice, setVoice] = useState("");
  const [language, setLanguage] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);

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
  }, []);

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
    onUploadClick: () => setUploadOpen(true),
  };

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
                <SingleGenerator {...sharedProps} />
              </TabsContent>
              <TabsContent value="bulk">
                <BulkGenerator {...sharedProps} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

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
