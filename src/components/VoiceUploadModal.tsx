import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { uploadVoice, type Language } from "@/lib/api";
import { Upload, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  languages: Language[];
  onSuccess: (voiceName: string) => void;
}

export default function VoiceUploadModal({
  open,
  onOpenChange,
  languages,
  onSuccess,
}: Props) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("da");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && !selected.name.endsWith(".wav")) {
      toast({
        title: "Ugyldig filtype",
        description: "Kun .wav filer er tilladt.",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }
    setFile(selected || null);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !language || !file) {
      toast({
        title: "Manglende felter",
        description: "Udfyld venligst alle felter.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      await uploadVoice(name, language, file);
      toast({ title: "Stemme uploadet", description: `"${name}" blev uploadet.` });
      onSuccess(name);
      onOpenChange(false);
      setName("");
      setLanguage("da");
      setFile(null);
    } catch {
      toast({
        title: "Fejl",
        description: "Noget gik galt. Prøv igen.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload ny stemme</DialogTitle>
          <DialogDescription>
            Upload en .wav-fil for at tilføje en ny stemme til systemet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="voice-name">Stemmenavn</Label>
            <Input
              id="voice-name"
              className="h-12"
              placeholder="F.eks. Min stemme"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Sprog</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Vælg sprog" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.id} value={lang.id}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="voice-file">Lydfil (.wav)</Label>
            <Input
              id="voice-file"
              type="file"
              accept=".wav"
              onChange={handleFileChange}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={uploading}
            size="lg"
            className="w-full sm:w-auto"
          >
            {uploading ? (
              <Loader2 className="animate-spin mr-2" />
            ) : (
              <Upload className="mr-2" />
            )}
            {uploading ? "Uploader..." : "Upload stemme"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
