
import { useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
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
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface ProjectActionsProps {
  project: {
    id: string;
    name: string;
    description?: string;
  };
  isOwnerOrAdmin: boolean;
  onProjectUpdated: () => void;
}

export function ProjectActions({ project, isOwnerOrAdmin, onProjectUpdated }: ProjectActionsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  if (!isOwnerOrAdmin) return null;

  async function handleSave() {
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('projects')
        .update({
          name,
          description: description || null
        })
        .eq('id', project.id);
        
      if (error) throw error;
      
      toast({
        title: "Projeto atualizado",
        description: "As informações do projeto foram atualizadas com sucesso."
      });
      
      setIsEditing(false);
      onProjectUpdated();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar projeto",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }
  
  async function handleDelete() {
    try {
      setIsDeleting(true);
      
      // Delete project members
      const { error: memberError } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', project.id);
        
      if (memberError) throw memberError;
      
      // Delete task assignees and dependencies
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('project_id', project.id);
        
      if (tasks && tasks.length > 0) {
        const taskIds = tasks.map(t => t.id);
        
        // Delete task assignees
        await supabase
          .from('task_assignees')
          .delete()
          .in('task_id', taskIds);
          
        // Delete task dependencies
        await supabase
          .from('task_dependencies')
          .delete()
          .in('predecessor_id', taskIds);
          
        await supabase
          .from('task_dependencies')
          .delete()
          .in('successor_id', taskIds);
      }
      
      // Delete tasks
      const { error: taskError } = await supabase
        .from('tasks')
        .delete()
        .eq('project_id', project.id);
        
      if (taskError) throw taskError;
      
      // Delete project
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);
        
      if (error) throw error;
      
      toast({
        title: "Projeto excluído",
        description: "O projeto foi excluído com sucesso."
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Erro ao excluir projeto",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  }
  
  if (isEditing) {
    return (
      <div className="space-y-3 border p-3 rounded-md">
        <div>
          <label htmlFor="project-name" className="text-sm font-medium mb-1 block">Nome do Projeto</label>
          <Input
            id="project-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-2"
          />
        </div>
        <div>
          <label htmlFor="project-description" className="text-sm font-medium mb-1 block">Descrição</label>
          <Textarea
            id="project-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        <div className="flex space-x-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setName(project.name);
              setDescription(project.description || "");
              setIsEditing(false);
            }}
            disabled={isSaving}
          >
            <X className="h-4 w-4 mr-1" />
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
          >
            {isSaving ? "Salvando..." : (
              <>
                <Check className="h-4 w-4 mr-1" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsEditing(true)}
        className="flex items-center"
      >
        <Pencil className="h-4 w-4 mr-1" />
        Editar
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsDeleteDialogOpen(true)}
        className="flex items-center text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
      >
        <Trash2 className="h-4 w-4 mr-1" />
        Excluir
      </Button>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o projeto
              "{project.name}" e todos os dados associados a ele.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
