import { useState, useEffect, useRef } from "react";
import { useParams, useOutletContext, useSearchParams } from "react-router-dom";
import GanttChart from "@/components/GanttChart";
import TaskForm from "@/components/TaskForm";
import { TaskType } from "@/components/Task";
import { useTasks } from "@/hooks/useTasks";
import { useToast } from "@/components/ui/use-toast";
import NewTaskButton from "@/components/NewTaskButton";
import LoadingState from "@/components/LoadingState";
import EmptyTaskState from "@/components/EmptyTaskState";
import ViewHeader from "@/components/ViewHeader";
import { Button } from "@/components/ui/button";
import { Download, ChevronLeftSquare } from "lucide-react";
import html2canvas from "html2canvas";

type ContextType = { hasEditPermission: boolean };

const GanttView = () => {
  const { toast } = useToast();
  const { projectId } = useParams<{ projectId: string }>();
  const { hasEditPermission } = useOutletContext<ContextType>();
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  const [isNewTask, setIsNewTask] = useState(false);
  const [projectMembers, setProjectMembers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [searchParams] = useSearchParams();
  
  const { tasks, loading, updateTask, createTask, createDependency, getProjectMembers } = useTasks();
  const tasksLoadedRef = useRef(false);
  const chartRef = useRef<HTMLDivElement>(null);

  // Carregar membros do projeto
  useEffect(() => {
    const loadMembers = async () => {
      const members = await getProjectMembers();
      setProjectMembers(members);
    };
    
    loadMembers();
  }, []);

  // Verificar se há um taskId na URL para abrir automaticamente
  useEffect(() => {
    if (!loading && tasks.length > 0 && tasksLoadedRef.current === false) {
      tasksLoadedRef.current = true;
      
      const taskId = searchParams.get('taskId');
      if (taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          handleEditTask(task);
        }
      }
    }
  }, [loading, tasks, searchParams]);

  const handleEditTask = (task: TaskType) => {
    setSelectedTask(task);
    setIsNewTask(false);
    setIsTaskFormOpen(true);
  };

  const handleAddTask = () => {
    if (!hasEditPermission) return;
    
    setSelectedTask(null);
    setIsNewTask(true);
    setIsTaskFormOpen(true);
  };

  const handleTaskFormSubmit = async (taskData: Partial<TaskType>) => {
    if (!hasEditPermission) return;
    
    if (isNewTask) {
      const newTaskDetails: Omit<TaskType, 'id'> = {
        name: taskData.name || "Nova Tarefa",
        startDate: taskData.startDate || new Date().toISOString().split('T')[0],
        duration: taskData.duration || 7,
        progress: taskData.progress || 0,
        dependencies: taskData.dependencies || [],
        assignees: taskData.assignees || [],
        isGroup: taskData.isGroup || false,
        isMilestone: taskData.isMilestone || false,
        parentId: taskData.parentId,
        priority: taskData.priority || 3
      };
      
      const result = await createTask(newTaskDetails);
      
      if (result) {
        toast({
          title: "Tarefa adicionada",
          description: `${newTaskDetails.name} foi adicionada com sucesso.`,
        });
        setIsTaskFormOpen(false);
      }
    } else if (selectedTask) {
      const updatedTaskData: TaskType = {
        ...selectedTask,
        ...taskData
      };
      
      const success = await updateTask(updatedTaskData);
      
      if (success) {
        toast({
          title: "Tarefa atualizada",
          description: `${updatedTaskData.name} foi atualizada com sucesso.`,
        });
        setIsTaskFormOpen(false);
      }
    }
  };

  const handleDependencyCreated = async (sourceId: string, targetId: string) => {
    if (!hasEditPermission) {
      toast({
        title: "Permissão negada",
        description: "Você não tem permissão para criar dependências.",
        variant: "destructive",
      });
      return;
    }
    
    if (sourceId === targetId) {
      toast({
        title: "Dependência inválida",
        description: "Uma tarefa não pode depender de si mesma.",
        variant: "destructive",
      });
      return;
    }
    
    const sourceTask = tasks.find(t => t.id === sourceId);
    const targetTask = tasks.find(t => t.id === targetId);
    
    if (!sourceTask || !targetTask) {
      toast({
        title: "Erro",
        description: "Tarefa não encontrada.",
        variant: "destructive",
      });
      return;
    }
    
    const hasCyclicDependency = (checkId: string, visitedIds = new Set<string>()): boolean => {
      if (checkId === sourceId) return true;
      if (visitedIds.has(checkId)) return false;
      
      visitedIds.add(checkId);
      
      const task = tasks.find(t => t.id === checkId);
      if (task?.dependencies?.length) {
        for (const depId of task.dependencies) {
          if (hasCyclicDependency(depId, new Set(visitedIds))) {
            return true;
          }
        }
      }
      
      return false;
    };
    
    if (hasCyclicDependency(targetId)) {
      toast({
        title: "Dependência cíclica",
        description: "Esta dependência criaria um ciclo entre as tarefas.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const success = await createDependency(sourceId, targetId);
      
      if (success) {
        toast({
          title: "Dependência criada",
          description: "A dependência foi criada com sucesso.",
        });
      } else {
        throw new Error("Falha ao criar dependência");
      }
    } catch (error) {
      console.error("Erro ao criar dependência:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao criar a dependência.",
        variant: "destructive",
      });
    }
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const exportToImage = async () => {
    if (!chartRef.current) return;
    
    try {
      const canvas = await html2canvas(chartRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `gantt-chart-${projectId || 'export'}-${new Date().toISOString().slice(0, 10)}.png`;
      link.click();
      
      toast({
        title: "Exportado com sucesso",
        description: "O gráfico Gantt foi exportado como imagem.",
      });
    } catch (error) {
      console.error("Erro ao exportar imagem:", error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar o gráfico como imagem.",
        variant: "destructive",
      });
    }
  };

  // Generate extra actions for ViewHeader
  const extraActions = (
    <Button 
      variant="outline"
      size="sm"
      onClick={exportToImage}
      className="flex items-center"
    >
      <Download className="h-4 w-4 mr-1" />
      Exportar
    </Button>
  );

  return (
    <div className="flex flex-col">
      <ViewHeader 
        title="Gráfico de Gantt" 
        onAddItem={handleAddTask}
        buttonText="Nova Tarefa"
        extraActions={extraActions}
        hideAddButton={!hasEditPermission}
      />
      
      <div className="flex items-center mb-4 mt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="text-muted-foreground"
          title={sidebarVisible ? "Esconder barra lateral" : "Mostrar barra lateral"}
        >
          <ChevronLeftSquare className="h-5 w-5" />
        </Button>
      </div>
      
      {loading ? (
        <LoadingState />
      ) : tasks.length === 0 ? (
        <EmptyTaskState onAddTask={handleAddTask} hideAddButton={!hasEditPermission} />
      ) : (
        <div className="gantt-container flex-1 min-h-[500px] overflow-auto bg-white dark:bg-gray-800 rounded-md shadow" ref={chartRef}>
          <GanttChart 
            tasks={tasks} 
            onTaskClick={hasEditPermission ? handleEditTask : undefined}
            onCreateDependency={hasEditPermission ? handleDependencyCreated : undefined}
            sidebarVisible={sidebarVisible}
            onToggleSidebar={toggleSidebar}
            hasEditPermission={hasEditPermission}
          />
        </div>
      )}
      
      {hasEditPermission && <NewTaskButton onClick={handleAddTask} />}
      
      <TaskForm
        open={isTaskFormOpen}
        onOpenChange={setIsTaskFormOpen}
        task={selectedTask}
        onSubmit={handleTaskFormSubmit}
        tasks={tasks}
        isNew={isNewTask}
        projectMembers={projectMembers}
        readOnly={!hasEditPermission}
      />
    </div>
  );
};

export default GanttView;
