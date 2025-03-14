
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { TaskType } from "@/components/Task";
import { useToast } from "@/components/ui/use-toast";
import { detectCyclicDependency } from "@/utils/cycleDetection";
import * as taskService from "@/services/taskService";
import { supabase } from "@/integrations/supabase/client";

export function useTasks() {
  const { projectId } = useParams<{ projectId: string }>();
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (projectId) {
      loadTasks();
    }
  }, [projectId]);

  async function loadTasks() {
    try {
      setLoading(true);
      
      const loadedTasks = await taskService.loadProjectTasks(projectId as string);
      console.log("Tarefas carregadas do banco:", loadedTasks);
      setTasks(loadedTasks);
    } catch (error: any) {
      console.error("Erro ao carregar tarefas:", error.message);
      toast({
        title: "Erro ao carregar tarefas",
        description: error.message,
        variant: "destructive",
      });
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateTask(updatedTask: TaskType) {
    try {
      const success = await taskService.updateExistingTask(projectId as string, updatedTask);
      
      if (success) {
        // Update tasks locally first for a responsive UI
        setTasks(prevTasks => 
          prevTasks.map(task => task.id === updatedTask.id ? 
            {...task, ...updatedTask} : task)
        );
      }
      
      return success;
    } catch (error: any) {
      console.error("Erro ao atualizar tarefa:", error.message);
      toast({
        title: "Erro ao atualizar tarefa",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  }
  
  async function createTask(newTask: Omit<TaskType, 'id'>) {
    try {
      const createdTask = await taskService.createNewTask(projectId as string, newTask);
      
      if (createdTask) {
        setTasks(prevTasks => [...prevTasks, createdTask]);
      }
      
      return createdTask;
    } catch (error: any) {
      console.error("Erro ao criar tarefa:", error.message);
      toast({
        title: "Erro ao criar tarefa",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  }

  async function createDependency(sourceId: string, targetId: string) {
    try {
      console.log("Criando dependência:", sourceId, "->", targetId);
      
      // Check for circular dependencies before creating
      if (detectCyclicDependency(tasks, sourceId, targetId)) {
        toast({
          title: "Erro ao criar dependência",
          description: "Não é possível criar dependências circulares",
          variant: "destructive",
        });
        return false;
      }
      
      const success = await taskService.createTaskDependency(projectId as string, sourceId, targetId);
      
      if (success) {
        // Update local tasks
        setTasks(prevTasks => {
          return prevTasks.map(task => {
            if (task.id === targetId) {
              const deps = task.dependencies || [];
              if (!deps.includes(sourceId)) {
                return {
                  ...task,
                  dependencies: [...deps, sourceId]
                };
              }
            }
            return task;
          });
        });
      }
      
      return success;
    } catch (error: any) {
      console.error("Erro ao criar dependência:", error.message);
      toast({
        title: "Erro ao criar dependência",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  }
  
  async function batchUpdateTasks(tasksToUpdate: TaskType[], tasksToCreate: Omit<TaskType, 'id'>[]) {
    try {
      // Check current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para atualizar tarefas.",
          variant: "destructive",
        });
        return false;
      }
      
      // Update existing tasks
      for (const task of tasksToUpdate) {
        await updateTask(task);
      }
      
      // Create new tasks
      for (const task of tasksToCreate) {
        await createTask(task);
      }
      
      // Reload tasks to ensure consistency
      await loadTasks();
      
      return true;
    } catch (error: any) {
      console.error("Erro na atualização em lote:", error.message);
      toast({
        title: "Erro ao atualizar tarefas",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  }
  
  async function getProjectMembers() {
    try {
      return await taskService.getProjectMembersList(projectId as string);
    } catch (error: any) {
      console.error("Erro ao buscar membros do projeto:", error.message);
      return [];
    }
  }
  
  async function deleteTask(taskId: string) {
    try {
      const success = await taskService.deleteProjectTask(taskId);
      
      if (success) {
        // Remove task from local list
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      }
      
      return success;
    } catch (error: any) {
      console.error("Erro ao deletar tarefa:", error.message);
      toast({
        title: "Erro ao deletar tarefa",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  }

  return { 
    tasks, 
    loading, 
    updateTask, 
    createTask, 
    createDependency,
    batchUpdateTasks,
    getProjectMembers,
    deleteTask
  };
}
