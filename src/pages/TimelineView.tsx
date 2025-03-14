
import { useState, useEffect } from "react";
import { useTasks } from "@/hooks/useTasks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Users, Flag } from "lucide-react";
import TaskForm from "@/components/TaskForm";
import { TaskType } from "@/components/Task";
import { Switch } from "@/components/ui/switch";

const TimelineView = () => {
  const { toast } = useToast();
  const { tasks, loading, createTask, getProjectMembers } = useTasks();
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  const [isNewTask, setIsNewTask] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(true);
  const [projectMembers, setProjectMembers] = useState<Array<{ id: string; name: string; email: string }>>([]);

  useEffect(() => {
    loadProjectMembers();
  }, []);

  const loadProjectMembers = async () => {
    const members = await getProjectMembers();
    setProjectMembers(members);
  };

  const handleAddTask = () => {
    setSelectedTask(null);
    setIsNewTask(true);
    setIsTaskFormOpen(true);
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
    }
  };

  // Get member name from id
  const getMemberName = (userId: string) => {
    const member = projectMembers.find(m => m.id === userId);
    return member ? member.name : "Usuário";
  };

  // Filter tasks based on showSubtasks setting
  const filteredTasks = showSubtasks 
    ? tasks 
    : tasks.filter(task => !task.parentId);

  // Filtrar tarefas para a linha do tempo - agrupar por mês
  const getTimelineItems = () => {
    if (!filteredTasks.length) return [];
    
    // Ordenar tarefas por data de início
    const sortedTasks = [...filteredTasks].sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    
    // Agrupar tarefas por mês
    const tasksByMonth: Record<string, TaskType[]> = {};
    
    sortedTasks.forEach(task => {
      const date = new Date(task.startDate);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (!tasksByMonth[monthKey]) {
        tasksByMonth[monthKey] = [];
      }
      
      tasksByMonth[monthKey].push(task);
    });
    
    // Converter para o formato exibido na timeline
    return Object.entries(tasksByMonth).map(([monthKey, monthTasks]) => {
      const [year, month] = monthKey.split('-').map(Number);
      const date = new Date(year, month - 1);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      
      // Calcular status do mês baseado no progresso médio das tarefas
      const totalProgress = monthTasks.reduce((sum, task) => sum + (task.progress || 0), 0);
      const avgProgress = totalProgress / monthTasks.length;
      
      let status = 'Pendente';
      if (avgProgress === 100) {
        status = 'Concluído';
      } else if (avgProgress > 0) {
        status = 'Em Andamento';
      }
      
      return {
        id: monthKey,
        title: monthName,
        date: monthName,
        description: `${monthTasks.length} tarefa(s) programada(s) para este mês.`,
        status,
        tasks: monthTasks
      };
    });
  };

  const timelineItems = getTimelineItems();

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Linha do Tempo</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="showSubtasks"
              checked={showSubtasks}
              onCheckedChange={setShowSubtasks}
            />
            <label htmlFor="showSubtasks" className="text-sm">
              Mostrar Subtarefas
            </label>
          </div>
          <Button 
            size="sm"
            className="bg-primary hover:bg-primary/90 text-white font-medium"
            onClick={handleAddTask}
          >
            <Plus className="h-4 w-4 mr-1" />
            Nova Tarefa
          </Button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-8">
          Carregando tarefas...
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white shadow-sm rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">Nenhuma tarefa encontrada para este projeto</p>
          <Button 
            onClick={handleAddTask}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar primeira tarefa
          </Button>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-8 bottom-0 w-0.5 bg-gray-200"></div>
          
          {/* Timeline items */}
          <div className="space-y-8">
            {timelineItems.map((item, index) => (
              <div key={item.id} className="relative animate-slide-in" style={{ animationDelay: `${index * 100}ms` }}>
                {/* Timeline dot */}
                <div className={`absolute left-6 top-8 w-4 h-4 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-10
                  ${item.status === 'Concluído' ? 'bg-green-500' : 
                    item.status === 'Em Andamento' ? 'bg-blue-500' : 'bg-gray-400'}`}
                ></div>
                
                {/* Content card */}
                <Card className="ml-12 shadow-sm hover:shadow transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                        <p className="text-sm text-gray-500 mb-3">{item.date}</p>
                        <p className="text-gray-700">{item.description}</p>
                        
                        {/* Lista de tarefas neste mês */}
                        <div className="mt-4 space-y-2">
                          {item.tasks.map((task) => (
                            <div key={task.id} className="flex items-center">
                              <div 
                                className={`w-2 h-2 rounded-full mr-2 
                                  ${task.isMilestone ? 'bg-purple-500' : 
                                    task.progress === 100 ? 'bg-green-500' : 
                                    task.progress > 0 ? 'bg-blue-500' : 'bg-gray-400'}`}
                              ></div>
                              
                              <span className={`text-sm ${task.parentId ? 'ml-4' : ''}`}>
                                {task.isMilestone && (
                                  <Flag className="h-3 w-3 inline mr-1 text-purple-600" />
                                )}
                                {task.name}
                              </span>
                              
                              <div className="ml-2 text-xs text-gray-500">
                                {!task.isMilestone && `(${task.progress}%)`}
                              </div>
                              
                              {task.assignees && task.assignees.length > 0 && (
                                <div className="ml-2 flex items-center">
                                  <Users className="h-3 w-3 text-blue-500 mr-1" />
                                  <span className="text-xs text-blue-600">
                                    {task.assignees.length > 1 
                                      ? `${task.assignees.length} assignees` 
                                      : getMemberName(task.assignees[0]).split(' ')[0]}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium
                        ${item.status === 'Concluído' ? 'bg-green-100 text-green-800' : 
                          item.status === 'Em Andamento' ? 'bg-blue-100 text-blue-800' : 
                          'bg-gray-100 text-gray-800'}`}
                      >
                        {item.status}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
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

export default TimelineView;
