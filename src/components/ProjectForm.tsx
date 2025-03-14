import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';

interface ProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated?: (projectId: string) => void;
  initialData?: any;
}

export function ProjectForm({ open, onOpenChange, onProjectCreated, initialData }: ProjectFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    ...(initialData || {})
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectCount, setProjectCount] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const subscription = useSubscription();
  const canCreateProject = subscription.canCreateProject(projectCount);
  const limitMessage = subscription.getProjectLimitMessage(projectCount);
  
  useEffect(() => {
    const loadProjectCount = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const { count, error } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', session.user.id);
            
          if (error) {
            console.error('Erro ao carregar contagem de projetos:', error);
          } else if (count !== null) {
            setProjectCount(count);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar contagem de projetos:', error);
      }
    };
    
    loadProjectCount();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (data: typeof formData) => {
    // Obter o usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Erro",
        description: "É necessário estar logado para criar um projeto.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Se for atualização de projeto existente
      if (initialData?.id) {
        const { error } = await supabase
          .from('projects')
          .update({
            name: data.name,
            description: data.description,
            start_date: data.startDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', initialData.id);
          
        if (error) throw error;
        
        toast({
          title: "Projeto atualizado",
          description: "O projeto foi atualizado com sucesso."
        });
        
        if (onProjectCreated) {
          onProjectCreated(initialData.id);
        }
      } 
      // Se for criação de novo projeto
      else {
        const { data: project, error } = await supabase
          .from('projects')
          .insert({
            name: data.name,
            description: data.description,
            start_date: data.startDate,
            owner_id: user.id
          })
          .select()
          .single();
          
        if (error) throw error;
        
        toast({
          title: "Projeto criado",
          description: "O projeto foi criado com sucesso."
        });
        
        if (onProjectCreated && project) {
          onProjectCreated(project.id);
        }
        
        // Navegar para o novo projeto
        if (project) {
          navigate(`/project/${project.id}/gantt`);
        }
      }
      
      // Fechar o modal
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao salvar o projeto.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canCreateProject && !initialData) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Projeto' : 'Novo Projeto'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Projeto</Label>
            <Input 
              id="name" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Digite o nome do projeto" 
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea 
              id="description" 
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descreva o projeto brevemente" 
              rows={4}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de Início</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">Data de Término</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          {!initialData && (
            <div className={`text-sm ${!canCreateProject ? 'text-red-500' : 'text-gray-500'}`}>
              {limitMessage}
              
              {!canCreateProject && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => subscription.upgradeToPremium()}
                    className="text-primary hover:text-primary-dark font-medium"
                  >
                    Fazer upgrade para o plano Premium
                  </button>
                </div>
              )}
            </div>
          )}
        
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting || (!initialData && !canCreateProject)}
            >
              {isSubmitting ? 'Salvando...' : initialData ? 'Atualizar Projeto' : 'Criar Projeto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
