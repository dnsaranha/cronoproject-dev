import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useTasks } from "@/hooks/useTasks";
import { TaskType } from "@/components/Task";
import ViewHeader from "@/components/ViewHeader";
import LoadingState from "@/components/LoadingState";
import EmptyTaskState from "@/components/EmptyTaskState";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import html2canvas from "html2canvas";
import CriticalPathDiagram from "@/components/CriticalPathDiagram";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ContextType {
  hasEditPermission: boolean;
}

export default function CriticalPathView() {
  const { tasks, loading, createTask } = useTasks();
  const { hasEditPermission } = useOutletContext<ContextType>();
  const [calculatingPath, setCalculatingPath] = useState(false);
  const { toast } = useToast();

  // Calculate critical path data when tasks change
  const { 
    criticalPathTasks, 
    nonCriticalTasks, 
    startNodes, 
    edgeConnections 
  } = useMemo(() => {
    setCalculatingPath(true);
    try {
      // Skip calculation if there aren't enough tasks or dependencies
      if (!tasks || tasks.length < 2) {
        return { 
          criticalPathTasks: [], 
          nonCriticalTasks: [],
          startNodes: [],
          edgeConnections: []
        };
      }

      // Filter out milestones and group tasks
      const filteredTasks = tasks.filter(t => !t.isMilestone && !t.isGroup);
      
      // Find all task dependencies
      const dependencyMap = new Map<string, string[]>();
      const successorsMap = new Map<string, string[]>();
      
      // Initialize maps
      filteredTasks.forEach(task => {
        dependencyMap.set(task.id, []);
        successorsMap.set(task.id, []);
      });
      
      // Build dependency relationships
      filteredTasks.forEach(task => {
        if (task.dependencies && task.dependencies.length > 0) {
          dependencyMap.set(task.id, task.dependencies);
          
          // Add this task as a successor to its dependencies
          task.dependencies.forEach(depId => {
            const successors = successorsMap.get(depId) || [];
            successors.push(task.id);
            successorsMap.set(depId, successors);
          });
        }
      });
      
      // Find start nodes (tasks with no dependencies)
      const startNodes = filteredTasks.filter(task => 
        !task.dependencies || task.dependencies.length === 0
      );
      
      // Calculate early start and early finish times
      const earlyStart = new Map<string, number>();
      const earlyFinish = new Map<string, number>();
      
      // Forward pass - calculate early times
      const calculateEarly = (taskId: string, currentTime: number) => {
        // If already calculated with a later time, keep that value
        if (earlyStart.has(taskId) && earlyStart.get(taskId)! > currentTime) {
          return;
        }
        
        const task = filteredTasks.find(t => t.id === taskId);
        if (!task) return;
        
        earlyStart.set(taskId, currentTime);
        const finish = currentTime + task.duration;
        earlyFinish.set(taskId, finish);
        
        // Process successors
        const successors = successorsMap.get(taskId) || [];
        successors.forEach(sucId => {
          const sucTask = filteredTasks.find(t => t.id === sucId);
          if (!sucTask) return;
          
          // Check if all dependencies of this successor have been processed
          const deps = dependencyMap.get(sucId) || [];
          const allDepsProcessed = deps.every(depId => earlyFinish.has(depId));
          
          if (allDepsProcessed) {
            // Find the latest early finish among all dependencies
            const maxEarlyFinish = Math.max(...deps.map(depId => earlyFinish.get(depId)!));
            calculateEarly(sucId, maxEarlyFinish);
          }
        });
      };
      
      // Start with all starting tasks
      startNodes.forEach(task => calculateEarly(task.id, 0));
      
      // Find the project end time (max early finish)
      const projectEndTime = Math.max(...Array.from(earlyFinish.values()));
      
      // Find end nodes (tasks with no successors)
      const endNodes = filteredTasks.filter(task => 
        !successorsMap.has(task.id) || successorsMap.get(task.id)!.length === 0
      );
      
      // Initialize late times
      const lateStart = new Map<string, number>();
      const lateFinish = new Map<string, number>();
      
      // Backward pass - calculate late times
      const calculateLate = (taskId: string, latestTime: number) => {
        const task = filteredTasks.find(t => t.id === taskId);
        if (!task) return;
        
        // If already calculated with an earlier time, keep that value
        if (lateFinish.has(taskId) && lateFinish.get(taskId)! < latestTime) {
          return;
        }
        
        lateFinish.set(taskId, latestTime);
        const start = latestTime - task.duration;
        lateStart.set(taskId, start);
        
        // Process predecessors
        const deps = dependencyMap.get(taskId) || [];
        deps.forEach(depId => {
          calculateLate(depId, start);
        });
      };
      
      // Start backward pass from end nodes
      endNodes.forEach(task => calculateLate(task.id, projectEndTime));
      
      // Calculate float (slack) for each task
      const taskFloats = new Map<string, number>();
      filteredTasks.forEach(task => {
        const es = earlyStart.get(task.id) || 0;
        const ls = lateStart.get(task.id) || 0;
        const float = ls - es;
        taskFloats.set(task.id, float);
      });
      
      // Identify critical path tasks (float = 0)
      const criticalPathTasks = filteredTasks.filter(task => 
        (taskFloats.get(task.id) || 0) === 0
      );
      
      const nonCriticalTasks = filteredTasks.filter(task => 
        (taskFloats.get(task.id) || 0) > 0
      );
      
      // Generate diagram connections
      const edgeConnections = filteredTasks.flatMap(task => {
        if (!task.dependencies || task.dependencies.length === 0) return [];
        
        return task.dependencies.map(depId => ({
          source: depId,
          target: task.id,
          isCritical: criticalPathTasks.some(t => t.id === depId) && 
                     criticalPathTasks.some(t => t.id === task.id)
        }));
      });
      
      // Assign calculated values to tasks for rendering
      const enhancedCriticalTasks = criticalPathTasks.map(task => ({
        ...task,
        earlyStart: earlyStart.get(task.id) || 0,
        earlyFinish: earlyFinish.get(task.id) || 0,
        lateStart: lateStart.get(task.id) || 0,
        lateFinish: lateFinish.get(task.id) || 0,
        float: 0
      }));
      
      const enhancedNonCriticalTasks = nonCriticalTasks.map(task => ({
        ...task,
        earlyStart: earlyStart.get(task.id) || 0,
        earlyFinish: earlyFinish.get(task.id) || 0,
        lateStart: lateStart.get(task.id) || 0,
        lateFinish: lateFinish.get(task.id) || 0,
        float: taskFloats.get(task.id) || 0
      }));
      
      return {
        criticalPathTasks: enhancedCriticalTasks,
        nonCriticalTasks: enhancedNonCriticalTasks, 
        startNodes,
        edgeConnections
      };
    } catch (error) {
      console.error("Error calculating critical path:", error);
      toast({
        title: "Erro no cálculo",
        description: "Ocorreu um erro ao calcular o caminho crítico. Verifique suas tarefas e dependências.",
        variant: "destructive",
      });
      return { 
        criticalPathTasks: [], 
        nonCriticalTasks: [],
        startNodes: [],
        edgeConnections: []
      };
    } finally {
      setCalculatingPath(false);
    }
  }, [tasks, toast]);

  // Handle exporting the diagram as an image
  const handleExportDiagram = async () => {
    const diagramElement = document.getElementById('critical-path-diagram');
    if (!diagramElement) {
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível encontrar o diagrama para exportação.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const canvas = await html2canvas(diagramElement, {
        backgroundColor: document.documentElement.classList.contains('dark') ? '#1f1f1f' : '#ffffff',
        scale: 2, // Higher resolution
      });
      
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = 'caminho-critico.png';
      link.click();
      
      toast({
        title: "Diagrama exportado",
        description: "O diagrama foi exportado com sucesso.",
      });
    } catch (error) {
      console.error("Error exporting diagram:", error);
      toast({
        title: "Erro na exportação",
        description: "Ocorreu um erro ao exportar o diagrama.",
        variant: "destructive",
      });
    }
  };

  const handleAddTask = () => {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Create a task with default values
    createTask({
      name: "Nova Tarefa",
      startDate: today,
      duration: 5,
      progress: 0,
      dependencies: [],
    });
  };

  if (loading || calculatingPath) {
    return <LoadingState />;
  }

  // If there are no tasks or not enough connected tasks
  const hasEnoughTasks = tasks.length >= 2 && edgeConnections.length > 0;

  return (
    <div className="space-y-6">
      <ViewHeader 
        title="Caminho Crítico do Projeto" 
        onAddItem={handleAddTask} 
        buttonText="Nova Tarefa"
        hideAddButton={!hasEditPermission}
        extraActions={
          hasEnoughTasks && (
            <Button 
              onClick={handleExportDiagram} 
              variant="outline"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar Diagrama
            </Button>
          )
        }
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Sobre o Caminho Crítico</CardTitle>
          <CardDescription className="text-sm">
            O Caminho Crítico representa a sequência de atividades que determina a menor duração possível 
            para a conclusão do projeto. Se uma atividade crítica atrasar, o projeto inteiro sofrerá impacto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span>Atividades Críticas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span>Atividades com Folga</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {!hasEnoughTasks ? (
        <EmptyTaskState 
          onAddTask={handleAddTask} 
          hideAddButton={!hasEditPermission} 
        />
      ) : (
        <div className="border rounded-md p-4 bg-card overflow-x-auto max-w-full">
          <div 
            id="critical-path-diagram" 
            className="min-w-[800px] w-full overflow-visible"
            style={{ minHeight: '500px' }}
          >
            <CriticalPathDiagram 
              criticalTasks={criticalPathTasks}
              nonCriticalTasks={nonCriticalTasks}
              connections={edgeConnections}
              hasEditPermission={hasEditPermission}
            />
          </div>
        </div>
      )}
    </div>
  );
}
