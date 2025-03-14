
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface InviteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function InviteForm({ open, onOpenChange, projectId }: InviteFormProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("viewer");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleInvite() {
    try {
      setLoading(true);
      
      // 1. Look up user by email
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();
        
      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // User not found
          toast({
            title: "Usuário não encontrado",
            description: "Este email não está cadastrado no sistema. O usuário precisa criar uma conta primeiro.",
            variant: "destructive",
          });
          return;
        } else {
          throw profileError;
        }
      }
      
      // 2. Check if user is already a member of this project
      const { data: existingMember, error: memberError } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', profileData.id)
        .single();
      
      if (existingMember) {
        toast({
          title: "Convite não enviado",
          description: "Este usuário já faz parte do projeto.",
          variant: "destructive",
        });
        return;
      }
      
      // 3. Add user as a project member
      const { error: insertError } = await supabase
        .from('project_members')
        .insert({
          project_id: projectId,
          user_id: profileData.id,
          role: role as any,
        });
        
      if (insertError) throw insertError;
      
      toast({
        title: "Convite enviado",
        description: `O usuário ${email} foi adicionado ao projeto com a função de ${role === 'admin' ? 'Administrador' : role === 'editor' ? 'Editor' : 'Visualizador'}.`,
      });
      
      // Reset form
      setEmail("");
      setRole("viewer");
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao enviar convite",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Convidar Colaborador</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email do Colaborador</Label>
            <Input 
              id="email" 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colaborador@exemplo.com" 
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Função no Projeto</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Selecione uma função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Visualizador</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Visualizador: Pode apenas ver o projeto<br />
              Editor: Pode criar e editar tarefas<br />
              Administrador: Pode gerenciar o projeto e os membros
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleInvite}
            disabled={loading || !email.trim()}
          >
            {loading ? "Enviando..." : "Convidar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
