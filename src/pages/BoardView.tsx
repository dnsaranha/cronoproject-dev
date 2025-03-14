
import { useState, useEffect } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useToast } from "@/components/ui/use-toast";
import KanbanColumn from "@/components/KanbanColumn";
import { TaskType } from "@/components/Task";
import TaskForm from "@/components/TaskForm";
import LoadingState from "@/components/LoadingState";
import EmptyTaskState from "@/components/EmptyTaskState";
import NewTaskButton from "@/components/NewTaskButton";
import ViewHeader from "@/components/ViewHeader";
import KanbanColumnForm, { KanbanColumnData } from "@/components/KanbanColumnForm";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const BoardView = () => {
  const { toast } = useToast();
  const { tasks, loading, updateTask, createTask, getProjectMembers } = useTasks();
  const [columns, setColumns] = useState<KanbanColumnData[]>([
    { id: "todo", title: "A Fazer", progressMin: 0, progressMax: 0 },
    { id: "in_progress", title: "Em Progresso", progressMin: 1, progressMax: 99 },
    { id: "done", title: "Concluído", progressMin: 100, progressMax: 100 }
  ]);
  
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isNewTask, setIsNewTask] = useState(false);
  
  const [selectedColumn, setSelectedColumn] = useState<KanbanColumnData | null>(null);
  const [isColumnFormOpen, setIsColumnFormOpen] = useState(false);
  const [isNewColumn, setIsNewColumn] = useState(false);
  
  const [projectMembers, setProjectMembers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  
  useEffect(() => {
    loadProjectMembers();
    
    // Load saved column configuration from localStorage if available
    const savedColumns = localStorage.getItem('kanban_columns');
    if (savedColumns) {
      try {
        setColumns(JSON.parse(savedColumns));
      } catch (e) {
        console.error('Failed to parse saved columns:', e);
      }
    }
  }, []);
  
  // Save columns configuration to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('kanban_columns', JSON.stringify(columns));
  }, [columns]);

  const loadProjectMembers = async () => {
    const members = await getProjectMembers();
    setProjectMembers(members);
  };

  const handleAddTask = () => {
    setSelectedTask(null);
    setIsNewTask(true);
    setIsTaskFormOpen(true);
  };
  
  const handleEditTask = (task: TaskType) => {
    setSelectedTask(task);
    setIsNewTask(false);
    setIsTaskFormOpen(true);
  };
  
  const handleAddColumn = () => {
    setSelectedColumn(null);
    setIsNewColumn(true);
    setIsColumnFormOpen(true);
  };
  
  const handleEditColumn = (columnId: string) => {
    const column = columns.find(col => col.id === columnId);
    if (column) {
      setSelectedColumn(column);
      setIsNewColumn(false);
      setIsColumnFormOpen(true);
    }
  };
  
  const handleDeleteColumn = (columnId: string) => {
    if (columns.length <= 2) {
      toast({
        title: "Operação não permitida",
        description: "Você deve manter pelo menos duas colunas no quadro.",
        variant: "destructive",
      });
      return;
    }
    
    // Remove column and update tasks
    setColumns(prevColumns => prevColumns.filter(col => col.id !== columnId));
    
    // Move tasks from deleted column to first column
    const firstColumnId = columns[0].id;
    
    // Update tasks in database if needed
    const tasksToUpdate = tasks.filter(task => getTaskColumn(task) === columnId);
    
    if (tasksToUpdate.length > 0) {
      // Batch update tasks
      tasksToUpdate.forEach(task => {
        // Determine new progress value based on first column
        const newProgress = columns[0].progressMin || 0;
        updateTask({ ...task, progress: newProgress });
      });
      
      toast({
        title: "Coluna excluída",
        description: `${tasksToUpdate.length} tarefas foram movidas para a coluna "${columns[0].title}".`,
      });
    } else {
      toast({
        title: "Coluna excluída",
        description: "A coluna foi excluída com sucesso.",
      });
    }
  };
  
  const handleColumnFormSubmit = (columnData: KanbanColumnData) => {
    if (isNewColumn) {
      // Add new column
      setColumns(prevColumns => [...prevColumns, columnData]);
      
      toast({
        title: "Coluna adicionada",
        description: `A coluna "${columnData.title}" foi adicionada com sucesso.`,
      });
    } else {
      // Update existing column
      setColumns(prevColumns => 
        prevColumns.map(col => 
          col.id === columnData.id ? columnData : col
        )
      );
      
      toast({
        title: "Coluna atualizada",
        description: `A coluna "${columnData.title}" foi atualizada com sucesso.`,
      });
      
      // Update tasks that may have moved due to progress range changes
      updateTasksBasedOnProgressRanges();
    }
  };
  
  const updateTasksBasedOnProgressRanges = () => {
    // This will be called when column ranges change to recategorize tasks
    // No need to update the tasks in the database as their progress hasn't changed
    // They'll just show up in different columns based on the new ranges
  };

  const getTaskColumn = (task: TaskType): string => {
    // Find which column this task belongs to based on its progress
    for (const column of columns) {
      const min = column.progressMin ?? 0;
      const max = column.progressMax ?? 100;
      
      if (task.progress >= min && task.progress <= max) {
        return column.id;
      }
    }
    
    // Default to first column if no match
    return columns[0]?.id || "todo";
  };
  
  const handleDropOnColumn = (columnId: string, taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Find the column's progress range
    const column = columns.find(col => col.id === columnId);
    if (!column) return;
    
    // Set the task's progress to the middle of the column's range
    const min = column.progressMin ?? 0;
    const max = column.progressMax ?? 100;
    let newProgress = Math.floor((min + max) / 2);
    
    // For "Done" column with 100% progress
    if (max === 100 && min === 100) {
      newProgress = 100;
    }
    // For "Todo" column with 0% progress
    else if (max === 0 && min === 0) {
      newProgress = 0;
    }
    
    // Update the task
    updateTask({
      ...task,
      progress: newProgress
    });
  };
  
  const handleTaskFormSubmit = async (taskData: Partial<TaskType>) => {
    if (isNewTask) {
      // Create new task
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

  if (loading) {
    return <LoadingState />;
  }

  if (tasks.length === 0) {
    return <EmptyTaskState onAddTask={handleAddTask} />;
  }

  return (
    <div className="flex flex-col h-full">
      <ViewHeader 
        title="Quadro Kanban" 
        onAddItem={handleAddTask}
        extraActions={
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAddColumn}
            className="flex items-center"
          >
            <Plus className="mr-1 h-4 w-4" />
            Nova Coluna
          </Button>
        }
      />
      
      <div className="board-container flex-1 overflow-x-auto py-2 touch-pan-x">
        <div className="flex space-x-4 h-full min-h-[500px] pr-4">
          {columns.map(column => {
            const columnTasks = tasks.filter(task => getTaskColumn(task) === column.id);
            
            return (
              <KanbanColumn 
                key={column.id}
                columnId={column.id}
                title={column.title}
                tasks={columnTasks}
                onDrop={(taskId) => handleDropOnColumn(column.id, taskId)}
                onEditTask={handleEditTask}
                onEditColumn={handleEditColumn}
                onDeleteColumn={handleDeleteColumn}
                totalColumns={columns.length}
              />
            );
          })}
        </div>
      </div>
      
      <NewTaskButton onClick={handleAddTask} />
      
      <TaskForm
        open={isTaskFormOpen}
        onOpenChange={setIsTaskFormOpen}
        task={selectedTask}
        onSubmit={handleTaskFormSubmit}
        tasks={tasks}
        isNew={isNewTask}
        projectMembers={projectMembers}
      />
      
      <KanbanColumnForm
        open={isColumnFormOpen}
        onOpenChange={setIsColumnFormOpen}
        column={selectedColumn}
        onSubmit={handleColumnFormSubmit}
        isNew={isNewColumn}
      />
    </div>
  );
};

export default BoardView;
