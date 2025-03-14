
import { Calendar, Clock, Pencil, Flag, ChevronRight, ChevronDown, Trash2, Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TaskType } from "@/components/Task";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TaskTableProps {
  tasks: TaskType[];
  onEditTask: (task: TaskType) => void;
  onDeleteTask?: (taskId: string) => void;
  projectMembers?: Array<{ id: string; name: string; email: string }>;
}

const TaskTable = ({ tasks, onEditTask, onDeleteTask, projectMembers = [] }: TaskTableProps) => {
  const [showSubtasks, setShowSubtasks] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  
  // Initialize expanded groups state with all groups expanded
  useEffect(() => {
    const initialExpandState: Record<string, boolean> = {};
    tasks.forEach(task => {
      if (task.isGroup) {
        initialExpandState[task.id] = true;
      }
    });
    setExpandedGroups(initialExpandState);
  }, [tasks]);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Calculate end date based on start date and duration
  const calculateEndDate = (startDate: string, duration: number) => {
    if (duration === 0) return formatDate(startDate); // For milestones
    
    const date = new Date(startDate);
    date.setDate(date.getDate() + duration);
    return formatDate(date.toISOString());
  };

  // Toggle group expansion
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Get member name from id
  const getMemberName = (userId: string) => {
    const member = projectMembers.find(m => m.id === userId);
    return member ? member.name : "Usuário";
  };

  // Get priority color and label
  const getPriorityInfo = (priority?: number) => {
    const priorityLevel = priority || 3;
    const options = [
      { value: 1, label: "Muito Baixa", color: "bg-gray-400", textColor: "text-gray-400" },
      { value: 2, label: "Baixa", color: "bg-blue-400", textColor: "text-blue-400" },
      { value: 3, label: "Média", color: "bg-green-400", textColor: "text-green-400" },
      { value: 4, label: "Alta", color: "bg-yellow-400", textColor: "text-yellow-400" },
      { value: 5, label: "Muito Alta", color: "bg-red-400", textColor: "text-red-400" }
    ];
    
    return options.find(o => o.value === priorityLevel) || options[2];
  };

  // Helper function to build a nested task hierarchy
  const buildTaskHierarchy = (allTasks: TaskType[]): TaskType[] => {
    // Create a map of tasks by ID for quick lookup
    const taskMap = new Map<string, TaskType & { children?: TaskType[] }>();
    
    // First pass: map all tasks to their IDs
    allTasks.forEach(task => {
      taskMap.set(task.id, { ...task, children: [] });
    });
    
    // Second pass: build tree structure
    const rootTasks: TaskType[] = [];
    
    allTasks.forEach(task => {
      const mappedTask = taskMap.get(task.id)!;
      
      if (task.parentId && taskMap.has(task.parentId)) {
        // This is a child task
        const parent = taskMap.get(task.parentId)!;
        parent.children = parent.children || [];
        parent.children.push(mappedTask);
      } else {
        // This is a root task
        rootTasks.push(mappedTask);
      }
    });
    
    return rootTasks;
  };

  // Recursively flatten task hierarchy based on expanded state
  const flattenTaskHierarchy = (tasks: (TaskType & { children?: TaskType[] })[], level = 0, result: (TaskType & { level: number })[] = []): (TaskType & { level: number })[] => {
    tasks.forEach(task => {
      // Add the task with its nesting level
      result.push({ ...task, level });
      
      // Add children if this group is expanded and we're showing subtasks
      if (task.isGroup && task.children && task.children.length > 0 && expandedGroups[task.id] && showSubtasks) {
        flattenTaskHierarchy(task.children, level + 1, result);
      }
    });
    
    return result;
  };

  // Build task hierarchy and flatten based on current expanded state
  const hierarchicalTasks = buildTaskHierarchy(tasks);
  const displayTasks = flattenTaskHierarchy(hierarchicalTasks);

  return (
    <div>
      <div className="p-2 flex items-center space-x-4 bg-gray-50 dark:bg-gray-800 border-b">
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
      </div>
      
      <Table className="dark-mode-fix">
        <TableHeader>
          <TableRow className="dark-mode-fix">
            <TableHead className="w-[300px]">Nome da Tarefa</TableHead>
            <TableHead className="w-[150px]">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Data de Início
              </div>
            </TableHead>
            <TableHead className="w-[120px]">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Duração
              </div>
            </TableHead>
            <TableHead className="w-[150px]">Data de Fim</TableHead>
            <TableHead className="w-[150px]">Progresso</TableHead>
            <TableHead className="w-[100px]">Prioridade</TableHead>
            <TableHead className="w-[150px]">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                Responsáveis
              </div>
            </TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayTasks.map((task) => {
            const priorityInfo = getPriorityInfo(task.priority);
            return (
              <TableRow 
                key={task.id} 
                className={`task-table-row dark-mode-fix ${task.isGroup ? "bg-gray-50 dark:bg-gray-800 font-medium" : ""}`}
              >
                <TableCell className={`dark-mode-fix ${task.isGroup ? "font-bold" : "font-medium"}`}>
                  <div className="flex items-center">
                    {/* Indent based on level */}
                    {task.level > 0 && (
                      <div style={{ width: `${task.level * 20}px` }} className="flex-shrink-0"></div>
                    )}
                    
                    {task.isGroup ? (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-0 mr-1 h-6 w-6"
                        onClick={() => toggleGroup(task.id)}
                      >
                        {expandedGroups[task.id] ? 
                          <ChevronDown className="h-4 w-4" /> : 
                          <ChevronRight className="h-4 w-4" />
                        }
                      </Button>
                    ) : null}
                    
                    {task.isMilestone && (
                      <Flag className="h-4 w-4 mr-1 text-purple-600 dark:text-purple-500" />
                    )}
                    
                    {task.name}
                  </div>
                </TableCell>
                <TableCell className="dark-mode-fix">{formatDate(task.startDate)}</TableCell>
                <TableCell className="dark-mode-fix">
                  {task.isMilestone ? (
                    <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/30 dark:text-purple-200">Marco</Badge>
                  ) : (
                    `${task.duration} dias`
                  )}
                </TableCell>
                <TableCell className="dark-mode-fix">{calculateEndDate(task.startDate, task.duration || 0)}</TableCell>
                <TableCell className="dark-mode-fix">
                  {!task.isMilestone && (
                    <>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div 
                          className="bg-gantt-blue dark:bg-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{task.progress}%</div>
                    </>
                  )}
                </TableCell>
                <TableCell className="dark-mode-fix">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${priorityInfo.color}`}></div>
                    <span className="text-xs">{priorityInfo.label}</span>
                  </div>
                </TableCell>
                <TableCell className="dark-mode-fix">
                  {task.assignees && task.assignees.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {task.assignees.slice(0, 2).map(userId => (
                        <TooltipProvider key={userId}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30">
                                {getMemberName(userId).split(' ')[0]}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{getMemberName(userId)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                      {task.assignees.length > 2 && (
                        <Badge variant="outline">+{task.assignees.length - 2}</Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">Nenhum</span>
                  )}
                </TableCell>
                <TableCell className="dark-mode-fix">
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onEditTask(task)}
                      className="px-2"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    
                    {onDeleteTask && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onDeleteTask(task.id)}
                        className="px-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default TaskTable;
