import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams, Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button"; // Adicione esta importação
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectMembers } from "@/components/ProjectMembers";
import LoadingState from "@/components/LoadingState";
import ExcelExportImport from "@/components/ExcelExportImport";
import { useTasks } from "@/hooks/useTasks";
import { TaskType } from "@/components/Task";
import { ProjectActions } from "@/components/ProjectActions";
import { useToast } from "@/components/ui/use-toast";
import { User } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at?: string;
}

interface ProfileInfo {
  id: string;
  full_name?: string;
  email?: string;
}

export default function ProjectView() {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const { pathname } = location;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Novo estado para erro
  const [isOwnerOrAdmin, setIsOwnerOrAdmin] = useState(false);
  const [hasEditPermission, setHasEditPermission] = useState(false);
  const [ownerProfile, setOwnerProfile] = useState<ProfileInfo | null>(null);
  const { tasks, batchUpdateTasks } = useTasks();
  const navigate = useNavigate();
  const [subViewLoading, setSubViewLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (projectId) {
      setLoading(true);
      setSubViewLoading(true);
      Promise.all([
        loadProject(),
        checkPermissions()
      ]).finally(() => {
        setLoading(false);
        setSubViewLoading(false);
      });
    } else {
    setError("ID do projeto não encontrado");
  }
}, [projectId]);

  async function loadProject() {
    try {
      setLoading(true);
      setError(null);

      if (!projectId) {
        setError("ID do projeto não especificado");
        return;
      }

      // Primeiro, verifica se o usuário está autenticado
      const { data: session } = await supabase.auth.getSession();
      if (!session?.user) {
        setError("Usuário não autenticado");
        navigate('/auth');
        return;
      }

      const { data: projectData, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        setError(`Erro ao carregar o projeto: ${error.message}`);
        return;
      }

      if (!projectData) {
        setError("Projeto não encontrado");
        return;
      }

      setProject(projectData);

      // Carrega informações do proprietário
      if (projectData.owner_id) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', projectData.owner_id)
          .single();

        if (!profileError && profileData) {
          setOwnerProfile(profileData);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(`Erro ao carregar o projeto: ${errorMessage}`);
      console.error('Erro ao carregar projeto:', error);
    } finally {
      setLoading(false);
    }
  }
  
  async function checkPermissions() {
    try {
      if (!projectId) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }
      
      // Check if user is owner
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('owner_id')
        .eq('id', projectId)
        .single();
        
      if (projectError) throw projectError;
      
      if (projectData.owner_id === user.id) {
        setIsOwnerOrAdmin(true);
        setHasEditPermission(true);
        return;
      }
      
      // Check if user is admin
      const { data: memberData, error: memberError } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single();
        
      if (memberError && memberError.code !== 'PGRST116') {
        // Check if user has any access to project
        const { data: anyMember, error: anyMemberError } = await supabase
          .from('project_members')
          .select('id')
          .eq('project_id', projectId)
          .eq('user_id', user.id);
          
        if (anyMemberError || !anyMember || anyMember.length === 0) {
          // User has no access to this project
          toast({
            title: "Acesso negado",
            description: "Você não tem permissão para acessar este projeto.",
            variant: "destructive",
          });
          navigate('/');
          return;
        }
      }
      
      setIsOwnerOrAdmin(memberData?.role === 'admin');
      setHasEditPermission(memberData?.role === 'admin' || memberData?.role === 'editor');
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      toast({
        title: "Erro",
        description: "Não foi possível verificar suas permissões. Tente novamente mais tarde.",
        variant: "destructive",
      });
      navigate('/');
    }
  }
  
  // Handle the import of Excel data
  const handleExcelImport = async (
    tasksToUpdate: TaskType[], 
    tasksToCreate: Omit<TaskType, 'id'>[]
  ) => {
    return await batchUpdateTasks(tasksToUpdate, tasksToCreate);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="text-red-500 text-center mb-4">{error}</div>
        <Button 
          onClick={() => {
            setError(null);
            navigate('/');
          }}
          className="bg-primary hover:bg-primary-dark"
        >
          Voltar para a página inicial
        </Button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="text-center mb-4">Projeto não encontrado</div>
        <Button onClick={() => navigate('/')} className="bg-primary hover:bg-primary-dark">
          Voltar para a página inicial
        </Button>
      </div>
    );
  }

  const formattedDate = project.created_at 
    ? new Date(project.created_at).toLocaleDateString('pt-BR') 
    : '';

  return (
    <div className="flex flex-col h-full">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground mt-1">{project.description}</p>
            )}
            
            <div className="flex items-center mt-2 text-sm text-muted-foreground">
              <User className="h-4 w-4 mr-1" />
              <span>Criado por: {ownerProfile?.full_name || ownerProfile?.email || 'Usuário'}</span>
              {formattedDate && <span className="ml-2">em {formattedDate}</span>}
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <ProjectActions 
              project={project} 
              isOwnerOrAdmin={isOwnerOrAdmin}
              onProjectUpdated={loadProject}
            />
            
            {hasEditPermission && (
              <ExcelExportImport 
                tasks={tasks} 
                projectId={projectId || ''} 
                onImport={handleExcelImport}
              />
            )}
          </div>
        </div>
        
        <div className="nav-tabs border-b bg-background flex">
          <div className="container mx-auto flex overflow-x-auto">
            <Link 
              to={`/project/${projectId}/gantt`} 
              className={`nav-item px-4 py-3 font-medium text-sm transition-colors 
                ${pathname.includes('/gantt') ? 'active text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Gantt
            </Link>
            
            <Link 
              to={`/project/${projectId}/board`} 
              className={`nav-item px-4 py-3 font-medium text-sm transition-colors 
                ${pathname.includes('/board') ? 'active text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Quadro
            </Link>
            
            <Link 
              to={`/project/${projectId}/equipe`} 
              className={`nav-item px-4 py-3 font-medium text-sm transition-colors 
                ${pathname.includes('/equipe') ? 'active text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Equipe
            </Link>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
      {subViewLoading ? (
        <div className="flex items-center justify-center h-full">
          <LoadingState />
        </div>
        ) : (
        <Outlet />
        )}
      </div>
    </div>
  );
}
