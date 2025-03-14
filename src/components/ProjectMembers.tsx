
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { InviteForm } from "@/components/InviteForm";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, UserX } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];

interface Member {
  id: string;
  user_id: string;
  role: UserRole;
  email: string;
  full_name: string | null;
}

interface ProjectMembersProps {
  projectId: string;
  isOwnerOrAdmin: boolean;
}

export function ProjectMembers({ projectId, isOwnerOrAdmin }: ProjectMembersProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [openInvite, setOpenInvite] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadMembers();
  }, [projectId]);

  async function loadMembers() {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('project_members')
        .select(`
          id,
          user_id,
          role,
          profiles (
            email,
            full_name
          )
        `)
        .eq('project_id', projectId);
        
      if (error) throw error;
      
      // Format the nested data
      const formattedMembers = data.map(member => ({
        id: member.id,
        user_id: member.user_id,
        role: member.role as UserRole,
        email: member.profiles.email,
        full_name: member.profiles.full_name,
      }));
      
      setMembers(formattedMembers);
    } catch (error: any) {
      console.error('Erro ao carregar membros:', error.message);
      toast({
        title: "Erro ao carregar membros",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(memberId: string, newRole: UserRole) {
    try {
      const { error } = await supabase
        .from('project_members')
        .update({ role: newRole })
        .eq('id', memberId);
        
      if (error) throw error;
      
      // Update local state
      setMembers(prev => 
        prev.map(member => 
          member.id === memberId 
            ? { ...member, role: newRole } 
            : member
        )
      );
      
      toast({
        title: "Função atualizada",
        description: "A função do membro foi atualizada com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar função",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  async function handleRemoveMember(memberId: string) {
    try {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('id', memberId);
        
      if (error) throw error;
      
      // Update local state
      setMembers(prev => prev.filter(member => member.id !== memberId));
      
      toast({
        title: "Membro removido",
        description: "O membro foi removido do projeto com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao remover membro",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  return (
    <div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Membros do Projeto</CardTitle>
          
          {isOwnerOrAdmin && (
            <Button size="sm" onClick={() => setOpenInvite(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Convidar
            </Button>
          )}
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Carregando membros...</div>
          ) : members.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              Nenhum membro encontrado além do proprietário.
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div 
                  key={member.id} 
                  className="flex items-center justify-between p-2 rounded-md border"
                >
                  <div>
                    <div className="font-medium">
                      {member.full_name || "Usuário"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {member.email}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isOwnerOrAdmin ? (
                      <>
                        <Select 
                          value={member.role} 
                          onValueChange={(value: UserRole) => handleRoleChange(member.id, value)}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Visualizador</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <UserX className="h-4 w-4 text-red-500" />
                        </Button>
                      </>
                    ) : (
                      <div className="px-3 py-1 rounded-full text-xs bg-gray-100">
                        {member.role === "admin" ? "Administrador" : 
                         member.role === "editor" ? "Editor" : "Visualizador"}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <InviteForm 
        open={openInvite} 
        onOpenChange={setOpenInvite} 
        projectId={projectId} 
      />
    </div>
  );
}
