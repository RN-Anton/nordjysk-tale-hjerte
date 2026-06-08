import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import rnLogo from "@/assets/rn-logo.png";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Loader2, Mic, Settings, Pencil, Trash2, Plus, X } from "lucide-react";
import {
  fetchVoicesManagement,
  createVoice,
  updateVoice,
  deleteVoice,
  type VoiceManagementItem,
} from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const Voices = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isLoggedIn, isAdmin, loading: authLoading, restoreSession, user } = useAuth();

  const [voices, setVoices] = useState<VoiceManagementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Create modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [createPath, setCreatePath] = useState("");
  const [createEmails, setCreateEmails] = useState<string[]>([]);
  const [createInputEmail, setCreateInputEmail] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editingVoice, setEditingVoice] = useState<VoiceManagementItem | null>(null);
  const [editPath, setEditPath] = useState("");
  const [editEmails, setEditEmails] = useState<string[]>([]);
  const [editInputEmail, setEditInputEmail] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete confirmation state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingVoiceId, setDeletingVoiceId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch voices
  const fetchVoices = async () => {
    if (!user?.email) return;
    try {
      setLoading(true);
      const data = await fetchVoicesManagement(user.email);
      setVoices(data);
    } catch (err: any) {
      toast({
        title: "Fejl",
        description: err.message || "Kunne ikke hente stemmer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Restore session on mount
  useEffect(() => {
    restoreSession().then((data) => {
      setSessionChecked(true);
      if (!data?.isAuthenticated) {
        navigate("/login", { replace: true });
      }
    });
  }, [restoreSession, navigate]);

  // Fetch voices when session is ready
  useEffect(() => {
    if (sessionChecked && isLoggedIn && user?.email) {
      fetchVoices();
    }
  }, [sessionChecked, isLoggedIn, user?.email]);

  // Redirect if not logged in
  useEffect(() => {
    if (sessionChecked && !isLoggedIn) {
      navigate("/login", { replace: true });
    }
  }, [sessionChecked, isLoggedIn, navigate]);

  // Add email to create list
  const handleAddCreateEmail = () => {
    const email = createInputEmail.trim().toLowerCase();
    if (email && !createEmails.includes(email)) {
      setCreateEmails([...createEmails, email]);
      setCreateInputEmail("");
    }
  };

  // Remove email from create list
  const handleRemoveCreateEmail = (email: string) => {
    setCreateEmails(createEmails.filter((e) => e !== email));
  };

  // Add email to edit list
  const handleAddEditEmail = () => {
    const email = editInputEmail.trim().toLowerCase();
    if (email && !editEmails.includes(email)) {
      setEditEmails([...editEmails, email]);
      setEditInputEmail("");
    }
  };

  // Remove email from edit list
  const handleRemoveEditEmail = (email: string) => {
    setEditEmails(editEmails.filter((e) => e !== email));
  };

  // Handle create submit
  const handleCreateSubmit = async () => {
    if (!user?.email || !createPath.trim()) {
      toast({
        title: "Fejl",
        description: "Udfyld venligst sti til voice data.",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      await createVoice(user.email, {
        voice_data_path: createPath.trim(),
        permissions: createEmails,
      });
      toast({
        title: "Succes",
        description: "Stemme oprettet successfully.",
      });
      setCreateOpen(false);
      setCreatePath("");
      setCreateEmails([]);
      setCreateInputEmail("");
      await fetchVoices();
    } catch (err: any) {
      toast({
        title: "Fejl",
        description: err.message || "Kunne ikke oprette stemme",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  // Open edit modal
  const handleOpenEdit = (voice: VoiceManagementItem) => {
    setEditingVoice(voice);
    setEditPath(voice.voice_data_path);
    setEditEmails([...voice.permissions]);
    setEditInputEmail("");
    setEditOpen(true);
  };

  // Handle edit submit
  const handleEditSubmit = async () => {
    if (!user?.email || !editingVoice || !editPath.trim()) {
      toast({
        title: "Fejl",
        description: "Udfyld venligst sti til voice data.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      await updateVoice(user.email, editingVoice.id, {
        voice_data_path: editPath.trim(),
        permissions: editEmails,
      });
      toast({
        title: "Succes",
        description: "Stemme opdateret successfully.",
      });
      setEditOpen(false);
      setEditingVoice(null);
      setEditPath("");
      setEditEmails([]);
      setEditInputEmail("");
      await fetchVoices();
    } catch (err: any) {
      toast({
        title: "Fejl",
        description: err.message || "Kunne ikke opdatere stemme",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Open delete confirmation
  const handleOpenDelete = (id: string) => {
    setDeletingVoiceId(id);
    setDeleteOpen(true);
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (!user?.email || !deletingVoiceId) return;

    try {
      setDeleting(true);
      await deleteVoice(user.email, deletingVoiceId);
      toast({
        title: "Succes",
        description: "Stemme slettet successfully.",
      });
      setDeleteOpen(false);
      setDeletingVoiceId(null);
      await fetchVoices();
    } catch (err: any) {
      toast({
        title: "Fejl",
        description: err.message || "Kunne ikke slette stemme",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  // Handle key press for email inputs
  const handleCreateEmailKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCreateEmail();
    }
  };

  const handleEditEmailKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddEditEmail();
    }
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
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-8 py-5">
          <img src={rnLogo} alt="Region Nordjylland" className="h-12 w-12 object-contain" />
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Voice Management System
            </h1>
            <p className="text-sm tracking-wide text-primary-foreground/70">
              Region Nordjylland
            </p>
          </div>
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:text-primary-foreground/80"
              onClick={() => navigate("/admin")}
              title="Admin"
            >
              <Settings className="h-5 w-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:text-primary-foreground/80"
            onClick={() => navigate("/")}
            title="Tilbage til TTS"
          >
            <Mic className="h-5 w-5" />
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Stemmer</h2>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Opret ny stemme
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : voices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Mic className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">Ingen stemmer fundet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Opret din første stemme for at komme i gang
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {voices.map((voice) => (
              <Card key={voice.id} className="shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg truncate">{voice.voice_data_path}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Ejer</Label>
                      <p className="text-sm font-medium truncate">{voice.owner_email}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Tilladte brugere</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {voice.permissions.map((email) => (
                          <Badge key={email} variant="secondary" className="text-xs">
                            {email}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenEdit(voice)}>
                        <Pencil className="h-3 w-3 mr-1" />
                        Rediger
                      </Button>
                      {user?.email === voice.owner_email && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleOpenDelete(voice.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Slet
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Opret ny stemme</DialogTitle>
            <DialogDescription>
              Udfyld informationerne for at oprette en ny brugerdefineret stemme.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-path">Voice Data Path</Label>
              <Input
                id="create-path"
                placeholder="/sti/til/voice/data"
                value={createPath}
                onChange={(e) => setCreatePath(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Permissions (e-mailadresser)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="user@example.com"
                  value={createInputEmail}
                  onChange={(e) => setCreateInputEmail(e.target.value)}
                  onKeyDown={handleCreateEmailKeyPress}
                />
                <Button type="button" variant="secondary" onClick={handleAddCreateEmail}>
                  Tilføj
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {createEmails.map((email) => (
                  <Badge key={email} variant="secondary" className="flex items-center gap-1">
                    {email}
                    <button
                      type="button"
                      onClick={() => handleRemoveCreateEmail(email)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Annuller
            </Button>
            <Button onClick={handleCreateSubmit} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Opretter...
                </>
              ) : (
                "Opret stemme"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Rediger stemme</DialogTitle>
            <DialogDescription>
              Opdater informationerne for stemmen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-path">Voice Data Path</Label>
              <Input
                id="edit-path"
                placeholder="/sti/til/voice/data"
                value={editPath}
                onChange={(e) => setEditPath(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Permissions (e-mailadresser)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="user@example.com"
                  value={editInputEmail}
                  onChange={(e) => setEditInputEmail(e.target.value)}
                  onKeyDown={handleEditEmailKeyPress}
                />
                <Button type="button" variant="secondary" onClick={handleAddEditEmail}>
                  Tilføj
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {editEmails.map((email) => (
                  <Badge key={email} variant="secondary" className="flex items-center gap-1">
                    {email}
                    <button
                      type="button"
                      onClick={() => handleRemoveEditEmail(email)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Annuller
            </Button>
            <Button onClick={handleEditSubmit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gemmer...
                </>
              ) : (
                "Gem ændringer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bekræft sletning</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på, at du vil slette denne stemme? Denne handling kan ikke fortrydes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteOpen(false)}>
              Annuller
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sletter...
                </>
              ) : (
                "Slet stemme"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Voices;