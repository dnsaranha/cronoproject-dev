
import { useState, useEffect } from "react";
import { useTasks } from "@/hooks/useTasks";
import { TaskType } from "@/components/Task";
import { useToast } from "@/components/ui/use-toast";
import TaskForm from "@/components/TaskForm";
import NewTaskButton from "@/components/NewTaskButton";
import { 
  AlertTriangle,
  CheckCircle2, 
  Flag, 
  Folder, 
  FolderOpen,
  Grip,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface WBSTaskNodeProps {
  task: TaskType;
  tasks: TaskType[];
  onTaskClick: (task: TaskType) => void;
  isExpanded: boolean;
  onToggleExpand: (taskId: string) => void;
  onDragStart: (e: React.DragEvent, task: TaskType) => void;
  onDragOver: (e: React.DragEvent, task: TaskType) => void;
  onDrop: (e: React.DragEvent, task: TaskType) => void;
  level: number;
}

const WBSTaskNode: React.FC<WBSTaskNodeProps> = ({
  task,
  tasks,
  onTaskClick,
  isExpanded,
  onToggleExpand,
  onDragStart,
  onDragOver,
  onDrop,
  level
}) => {
  const childTasks = tasks.filter(t => t.parentId === task.id);
  const hasChildren = childTasks.length > 0;
  
  // Get priority color
  const getPriorityColor = (priority: number = 3) => {
    switch(priority) {
      case 1: return "bg-gray-400";
      case 2: return "bg-blue-400";
      case 3: return "bg-green-400";
      case 4: return "bg-yellow-400";
      case 5: return "bg-red-400";
      default: return "bg-green-400";
    }
  };
  
  return (
    <div className="wbs-node">
      <div 
        className={`relative flex items-center p-2 rounded-lg mb-2 ${
          task.isGroup ? 'bg-muted' : 'bg-card'
        } border shadow-sm hover:shadow-md transition-shadow`}
        draggable={true}
        onDragStart={(e) => onDragStart(e, task)}
        onDragOver={(e) => onDragOver(e, task)}
        onDrop={(e) => onDrop(e, task)}
        style={{ marginLeft: `${level * 16}px` }}
      >
        <div className="absolute left-2 top-0 bottom-0 flex items-center cursor-grab touch-manipulate">
          <Grip className="w-4 h-4 text-muted-foreground opacity-50" />
        </div>
        
        <div className="ml-6 flex-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasChildren && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0"
                onClick={() => onToggleExpand(task.id)}
              >
                {isExpanded ? 
                  <FolderOpen className="w-4 h-4 text-blue-500" /> : 
                  <Folder className="w-4 h-4 text-blue-500" />
                }
              </Button>
            )}
            
            {task.isMilestone && (
              <Flag className="w-4 h-4 text-purple-500" />
            )}
            
            <div className="mr-2">
              <div className="flex items-center gap-1">
                <span 
                  className={`inline-block w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} 
                  title={`Prioridade ${task.priority}`}
                ></span>
                <span className="font-medium">{task.name}</span>
                
                {task.progress === 100 && (
                  <CheckCircle2 className="w-4 h-4 text-green-500 ml-1" />
                )}
              </div>
              
              <div className="text-xs text-muted-foreground mt-1">
                {!task.isMilestone ? (
                  <span>{task.duration} dias • {task.progress}% concluído</span>
                ) : (
                  <Badge variant="outline" className="text-xs bg-purple-50">Marco</Badge>
                )}
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-6"
            onClick={() => onTaskClick(task)}
          >
            Editar
          </Button>
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="ml-4">
          {childTasks.map(child => (
            <WBSTaskNode
              key={child.id}
              task={child}
              tasks={tasks}
              onTaskClick={onTaskClick}
              isExpanded={isExpanded}
              onToggleExpand={onToggleExpand}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const WBSView = () => {
  const { toast } = useToast();
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  const [isNewTask, setIsNewTask] = useState(false);
  const [projectMembers, setProjectMembers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [draggingTask, setDraggingTask] = useState<TaskType | null>(null);
  
  const { tasks, loading, updateTask, createTask, getProjectMembers } = useTasks();
  
  useEffect(() => {
    loadProjectMembers();
    
    // Initialize all group tasks as expanded
    const expanded: Record<string, boolean> = {};
    tasks.filter(t => t.isGroup).forEach(task => {
      expanded[task.id] = true;
    });
    setExpandedTasks(expanded);
  }, [tasks.length]);
  
  const loadProjectMembers = async () => {
    const members = await getProjectMembers();
    setProjectMembers(members);
  };
  
  const handleTaskClick = (task: TaskType) => {
    setSelectedTask(task);
    setIsNewTask(false);
    setIsTaskFormOpen(true);
  };
  
  const handleAddTask = () => {
    setSelectedTask(null);
    setIsNewTask(true);
    setIsTaskFormOpen(true);
  };
  
  const handleTaskFormSubmit = async (taskData: Partial<TaskType>) => {
    if (isNewTask) {
      // Create new task
      const newTaskDetails: Omit<TaskType, 'id'> = {
        name: taskData.name || "Nova Tarefa",
        startDate: taskData.startDate || new Date().toISOString().split('T')[0],
        duration: taskData.duration || 1,
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
      // Update existing task
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
  
  const toggleTaskExpand = (taskId: string) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };
  
  const handleDragStart = (e: React.DragEvent, task: TaskType) => {
    setDraggingTask(task);
    e.dataTransfer.setData("text/plain", task.id);
    e.dataTransfer.effectAllowed = "move";
  };
  
  const handleDragOver = (e: React.DragEvent, task: TaskType) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    
    // Prevent dropping onto itself or onto a child
    if (draggingTask) {
      // Check if target is the dragged task itself
      if (task.id === draggingTask.id) {
        return;
      }
      
      // Check if target is a child of the dragged task (would create circular parentage)
      let currentParent = task.parentId;
      while (currentParent) {
        if (currentParent === draggingTask.id) {
          return;
        }
        const parentTask = tasks.find(t => t.id === currentParent);
        currentParent = parentTask?.parentId;
      }
    }
  };
  
  const handleDrop = async (e: React.DragEvent, targetTask: TaskType) => {
    e.preventDefault();
    
    if (!draggingTask) return;
    
    // Prevent dropping onto itself
    if (targetTask.id === draggingTask.id) return;
    
    // Check for circular parentage
    let currentParent = targetTask.parentId;
    while (currentParent) {
      if (currentParent === draggingTask.id) {
        toast({
          title: "Operação inválida",
          description: "Não é possível mover uma tarefa para dentro de uma de suas subtarefas.",
          variant: "destructive"
        });
        return;
      }
      const parentTask = tasks.find(t => t.id === currentParent);
      currentParent = parentTask?.parentId;
    }
    
    // Determine the new parent based on where it was dropped
    let newParentId: string | undefined;
    
    if (targetTask.isGroup) {
      // If dropped on a group, make it a child of that group
      newParentId = targetTask.id;
      
      // Expand the group automatically
      setExpandedTasks(prev => ({
        ...prev,
        [targetTask.id]: true
      }));
    } else {
      // If dropped on a regular task, make them siblings (same parent)
      newParentId = targetTask.parentId;
    }
    
    // Update the dragged task with the new parent
    if (draggingTask.parentId !== newParentId) {
      const updatedTask: TaskType = {
        ...draggingTask,
        parentId: newParentId
      };
      
      const success = await updateTask(updatedTask);
      
      if (success) {
        toast({
          title: "Tarefa movida",
          description: `${draggingTask.name} foi movida com sucesso.`,
        });
      }
    }
    
    setDraggingTask(null);
  };
  
  // Get top-level tasks (no parent)
  const topLevelTasks = tasks.filter(t => !t.parentId);
  
  // Priority legend
  const priorityLegend = [
    { level: 1, label: "Muito Baixa", color: "bg-gray-400" },
    { level: 2, label: "Baixa", color: "bg-blue-400" },
    { level: 3, label: "Média", color: "bg-green-400" },
    { level: 4, label: "Alta", color: "bg-yellow-400" },
    { level: 5, label: "Muito Alta", color: "bg-red-400" }
  ];

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h1 className="text-2xl font-semibold">Estrutura Analítica do Projeto (EAP)</h1>
        </div>
        <NewTaskButton onClick={handleAddTask} />
      </div>
      
      <Card className="p-4 mb-4">
        <div className="text-sm text-muted-foreground mb-4">
          Arraste e solte as tarefas para reorganizar a estrutura do projeto. Tarefas podem ser movidas para dentro de grupos ou para outros níveis da hierarquia.
        </div>
        
        <div className="flex flex-wrap items-center gap-4 mb-2">
          <div className="text-sm font-medium">Prioridades:</div>
          {priorityLegend.map(priority => (
            <div key={priority.level} className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${priority.color} mr-1`}></div>
              <span className="text-xs text-muted-foreground">{priority.label}</span>
            </div>
          ))}
        </div>
      </Card>
      
      {loading ? (
        <div className="flex items-center justify-center py-8">
          Carregando tarefas...
        </div>
      ) : topLevelTasks.length === 0 ? (
        <div className="bg-card shadow-sm rounded-lg p-8 text-center">
          <p className="text-muted-foreground mb-4">Nenhuma tarefa encontrada para este projeto</p>
          <Button onClick={handleAddTask}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Tarefa
          </Button>
        </div>
      ) : (
        <div className="bg-card shadow-sm rounded-lg p-4">
          <div className="wbs-container">
            {topLevelTasks.map(task => (
              <WBSTaskNode
                key={task.id}
                task={task}
                tasks={tasks}
                onTaskClick={handleTaskClick}
                isExpanded={expandedTasks[task.id] || false}
                onToggleExpand={toggleTaskExpand}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                level={0}
              />
            ))}
          </div>
        </div>
      )}
      
      <TaskForm
        open={isTaskFormOpen}
        onOpenChange={setIsTaskFormOpen}
        task={selectedTask}
        onSubmit={handleTaskFormSubmit}
        tasks={tasks}
        isNew={isNewTask}
        projectMembers={projectMembers}
      />
    </div>
  );
};

export default WBSView;
