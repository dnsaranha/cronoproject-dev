
import { useState, useEffect } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useToast } from "@/components/ui/use-toast";
import TaskForm from "@/components/TaskForm";
import { TaskType } from "@/components/Task";
import TaskTable from "@/components/TaskTable";
import EmptyTaskState from "@/components/EmptyTaskState";
import LoadingState from "@/components/LoadingState";
import ViewHeader from "@/components/ViewHeader";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";

const GridView = () => {
  const { toast } = useToast();
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  const [isNewTask, setIsNewTask] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [projectMembers, setProjectMembers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  
  const { 
    tasks, 
    loading, 
    updateTask, 
    createTask, 
    getProjectMembers,
    deleteTask
  } = useTasks();

  useEffect(() => {
    loadProjectMembers();
  }, []);

  const loadProjectMembers = async () => {
    const members = await getProjectMembers();
    setProjectMembers(members);
  };

  const handleEditTask = (task: TaskType) => {
    setSelectedTask(task);
    setIsNewTask(false);
    setIsTaskFormOpen(true);
  };

  const handleAddTask = () => {
    setSelectedTask(null);
    setIsNewTask(true);
    setIsTaskFormOpen(true);
  };
  
  const handleDeleteTask = (taskId: string) => {
    setTaskToDelete(taskId);
  };
  
  const confirmDeleteTask = async () => {
    if (taskToDelete) {
      const success = await deleteTask(taskToDelete);
      
      if (success) {
        toast({
          title: "Tarefa excluída",
          description: "A tarefa foi excluída com sucesso.",
        });
      }
      
      setTaskToDelete(null);
    }
  };
  
  const handleTaskFormSubmit = async (taskData: Partial<TaskType>) => {
    if (isNewTask) {
      // Criar nova tarefa
      const newTaskDetails: Omit<TaskType, 'id'> = {
        name: taskData.name || "Nova Tarefa",
        startDate: taskData.startDate || new Date().toISOString().split('T')[0],
        duration: taskData.duration || 7,
        progress: taskData.progress || 0,
        dependencies: taskData.dependencies || [],
        assignees: taskData.assignees || [],
        isGroup: taskData.isGroup || false,
        isMilestone: taskData.isMilestone || false,
        parentId: taskData.parentId
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
      // Atualizar tarefa existente
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

  return (
    <div className="flex flex-col">
      <ViewHeader title="Grade de Tarefas" onAddItem={handleAddTask} />
      
      {loading ? (
        <LoadingState />
      ) : tasks.length === 0 ? (
        <EmptyTaskState onAddTask={handleAddTask} />
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <TaskTable 
            tasks={tasks} 
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            projectMembers={projectMembers}
          />
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
      
      <AlertDialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Tarefa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTask} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GridView;
