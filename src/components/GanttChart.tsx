import { useState, useRef, useEffect } from "react";
import Task, { TaskType } from "./Task";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, ChevronLeftSquare, ChevronRightSquare, Plus, ZoomIn, ZoomOut, Download } from "lucide-react";
import html2canvas from "html2canvas";
import { useToast } from "@/components/ui/use-toast";

interface GanttChartProps {
  tasks: TaskType[];
  onTaskClick?: (task: TaskType) => void;
  onAddTask?: () => void;
  onTaskUpdate?: (updatedTask: TaskType) => void;
  onCreateDependency?: (sourceId: string, targetId: string) => void;
  sidebarVisible?: boolean;
  onToggleSidebar?: () => void;
  hasEditPermission?: boolean;
}

const GanttChart = ({ 
  tasks, 
  onTaskClick, 
  onAddTask, 
  onTaskUpdate,
  onCreateDependency,
  sidebarVisible = true,
  onToggleSidebar,
  hasEditPermission = true
}: GanttChartProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [draggingTask, setDraggingTask] = useState<TaskType | null>(null);
  const [dragOverTask, setDragOverTask] = useState<TaskType | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'above' | 'below' | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ weekIndex: number, rowIndex: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ganttGridRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [createDependencyMode, setCreateDependencyMode] = useState<{active: boolean, sourceId: string} | null>(null);
  const [cellWidth, setCellWidth] = useState(100); // Base cell width
  const [zoomLevel, setZoomLevel] = useState(1); // Default zoom level
  const chartRef = useRef<HTMLDivElement>(null);
  
  const calculateDateRange = () => {
    if (!tasks || tasks.length === 0) {
      const today = new Date();
      const oneMonthLater = new Date(today);
      oneMonthLater.setMonth(today.getMonth() + 1);
      
      return {
        startDate: new Date(today.getFullYear(), today.getMonth(), 1),
        endDate: new Date(oneMonthLater.getFullYear(), oneMonthLater.getMonth() + 2, 0)
      };
    }
    
    let earliestStart = new Date();
    let latestEnd = new Date();
    
    tasks.forEach(task => {
      const taskStart = new Date(task.startDate);
      
      const taskEnd = new Date(taskStart);
      taskEnd.setDate(taskStart.getDate() + (task.duration || 0));
      
      if (taskStart < earliestStart || earliestStart.toString() === new Date().toString()) {
        earliestStart = new Date(taskStart);
      }
      
      if (taskEnd > latestEnd) {
        latestEnd = new Date(taskEnd);
      }
    });
    
    earliestStart.setDate(1);
    latestEnd.setMonth(latestEnd.getMonth() + 1);
    latestEnd = new Date(latestEnd.getFullYear(), latestEnd.getMonth() + 1, 0);
    
    return { startDate: earliestStart, endDate: latestEnd };
  };
  
  const dateRange = calculateDateRange();
  const startDate = dateRange.startDate;
  const endDate = dateRange.endDate;
  
  const getMonthDifference = (start: Date, end: Date) => {
    return (end.getFullYear() - start.getFullYear()) * 12 + 
           (end.getMonth() - start.getMonth()) + 1;
  };
  
  const monthsToShow = getMonthDifference(startDate, endDate);
  const weeksPerMonth = 4;
  const totalCells = monthsToShow * weeksPerMonth;
  
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    
    const initialExpanded: Record<string, boolean> = {};
    tasks.filter(t => t.isGroup).forEach(task => {
      initialExpanded[task.id] = true;
    });
    setExpandedGroups(initialExpanded);
    
    return () => window.removeEventListener('resize', updateWidth);
  }, [tasks]);
  
  const toggleGroup = (taskId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };
  
  const months = [];
  for (let i = 0; i < monthsToShow; i++) {
    const month = new Date(startDate);
    month.setMonth(month.getMonth() + i);
    months.push({
      name: month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      weeks: weeksPerMonth
    });
  }
  
  const weeks = [];
  for (let i = 0; i < totalCells; i++) {
    const weekDate = new Date(startDate);
    weekDate.setDate(weekDate.getDate() + (i * 7));
    weeks.push(`Semana ${weekDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'numeric' })}`);
  }
  
  const actualCellWidth = cellWidth * zoomLevel;
  const tableWidth = actualCellWidth * totalCells;
  
  const getTaskStyle = (task: TaskType) => {
    const taskStart = new Date(task.startDate);
    const diffTime = Math.abs(taskStart.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const position = (diffDays / 7) * actualCellWidth;
    const width = (task.duration / 7) * actualCellWidth;
    
    return {
      marginLeft: `${position}px`,
      width: `${width}px`,
    };
  };

  const isTaskVisible = (task: TaskType) => {
    if (!task.parentId) return true;
    
    let currentParentId = task.parentId;
    while (currentParentId) {
      if (!expandedGroups[currentParentId]) return false;
      
      const parentTask = tasks.find(t => t.id === currentParentId);
      currentParentId = parentTask?.parentId;
    }
    
    return true;
  };

  const sortTasksHierarchically = (taskList: TaskType[]): TaskType[] => {
    const topLevelTasks = taskList.filter(t => !t.parentId);
    
    const getTaskWithChildren = (parentTask: TaskType): TaskType[] => {
      const children = taskList.filter(t => t.parentId === parentTask.id);
      
      if (children.length === 0) {
        return [parentTask];
      }
      
      return [
        parentTask,
        ...children.flatMap(child => getTaskWithChildren(child))
      ];
    };
    
    return topLevelTasks.flatMap(task => getTaskWithChildren(task));
  };

  const processedTasks = sortTasksHierarchically(tasks);
  const visibleTasks = processedTasks.filter(isTaskVisible);
  
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 2));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };
  
  const handleTaskDragStart = (e: React.DragEvent, task: TaskType) => {
    if (createDependencyMode) {
      e.preventDefault();
      return;
    }
    
    e.dataTransfer.setData("application/x-task-reorder", task.id);
    e.dataTransfer.setData("task-id", task.id);
    e.dataTransfer.effectAllowed = "move";
    
    setDraggingTask(task);
  };
  
  const handleTaskDragEnd = (e: React.DragEvent, task: TaskType) => {
    if (dragOverTask && dragOverPosition && onTaskUpdate) {
      const siblingTasks = tasks.filter(t => 
        t.parentId === (task.parentId || null) && t.id !== task.id
      );
      
      const targetIndex = processedTasks.findIndex(t => t.id === dragOverTask.id);
      
      let newParentId = task.parentId;
      
      if (dragOverTask.id !== task.id) {
        if (dragOverTask.isGroup) {
          newParentId = dragOverTask.id;
          setExpandedGroups(prev => ({
            ...prev,
            [dragOverTask.id]: true
          }));
        } 
        else {
          newParentId = dragOverTask.parentId;
        }
        
        if (task.parentId !== newParentId) {
          const updatedTask = { ...task, parentId: newParentId };
          onTaskUpdate(updatedTask);
        }
      }
    }
    
    else if (dragOverCell && onTaskUpdate) {
      const { weekIndex } = dragOverCell;
      
      const newStartDate = new Date(startDate);
      newStartDate.setDate(newStartDate.getDate() + (weekIndex * 7));
      
      const formattedDate = newStartDate.toISOString().split('T')[0];
      
      const updatedTask = { ...task, startDate: formattedDate };
      onTaskUpdate(updatedTask);
    }
    
    setDraggingTask(null);
    setDragOverTask(null);
    setDragOverPosition(null);
    setDragOverCell(null);
  };
  
  const handleTaskDragOver = (e: React.DragEvent, task: TaskType) => {
    e.preventDefault();
    
    if (draggingTask && draggingTask.id !== task.id) {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseY = e.clientY;
      const threshold = rect.top + (rect.height / 2);
      
      const position = mouseY < threshold ? 'above' : 'below';
      
      setDragOverTask(task);
      setDragOverPosition(position);
    }
  };
  
  const handleTaskDragLeave = () => {
    setDragOverTask(null);
    setDragOverPosition(null);
  };
  
  const handleCellDragOver = (e: React.DragEvent, weekIndex: number, rowIndex: number) => {
    e.preventDefault();
    setDragOverCell({ weekIndex, rowIndex });
  };
  
  const handleCellDrop = (e: React.DragEvent, weekIndex: number, rowIndex: number) => {
    e.preventDefault();
    setDragOverCell(null);
  };
  
  const handleTaskResize = (task: TaskType, newDuration: number) => {
    if (onTaskUpdate) {
      const updatedTask = { ...task, duration: newDuration };
      onTaskUpdate(updatedTask);
    }
  };
  
  const handleDependencyStartClick = (taskId: string) => {
    setCreateDependencyMode({
      active: true,
      sourceId: taskId
    });
  };
  
  const handleDependencyTargetClick = (taskId: string) => {
    if (createDependencyMode && createDependencyMode.active) {
      if (createDependencyMode.sourceId !== taskId) {
        if (onCreateDependency) {
          onCreateDependency(createDependencyMode.sourceId, taskId);
        }
      }
      
      setCreateDependencyMode(null);
    }
  };
  
  const handleTaskClick = (task: TaskType) => {
    if (createDependencyMode && createDependencyMode.active) {
      handleDependencyTargetClick(task.id);
    } else if (onTaskClick) {
      onTaskClick(task);
    }
  };
  
  const handleGridClick = (e: React.MouseEvent) => {
    if (createDependencyMode && e.target === ganttGridRef.current) {
      setCreateDependencyMode(null);
    }
  };

  // Função para exportar o gráfico como imagem
  const exportToImage = async () => {
    if (!containerRef.current) return;
    
    try {
      const canvas = await html2canvas(containerRef.current, {
        allowTaint: true,
        useCORS: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight,
        scale: 1.5
      });
      
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `gantt-${new Date().toISOString().split('T')[0]}.png`;
      link.href = image;
      link.click();
      
      // Feedback para o usuário
      toast({
        title: "Exportado com sucesso",
        description: "A imagem do gráfico de Gantt foi baixada.",
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
  
  const priorityLegend = [
    { level: 1, label: "Muito Baixa", color: "bg-gray-400" },
    { level: 2, label: "Baixa", color: "bg-blue-400" },
    { level: 3, label: "Média", color: "bg-green-400" },
    { level: 4, label: "Alta", color: "bg-yellow-400" },
    { level: 5, label: "Muito Alta", color: "bg-red-400" }
  ];
  
  // Importe o hook useToast
  const { toast } = useToast();
  
  return (
    <div className="gantt-wrapper" ref={chartRef}>
      <>
        <div className="rounded-md border overflow-hidden" ref={containerRef}>
          <div className="overflow-auto">
            <div className="flex">
              {sidebarVisible && (
                <div className="min-w-64 w-64 border-r bg-card flex-shrink-0">
                  <div className="h-24 px-4 flex items-end border-b">
                    <div className="text-sm font-medium text-muted-foreground pb-2">Nome da Tarefa</div>
                  </div>
                  
                  <div>
                    {visibleTasks.map((task, rowIndex) => (
                      <div 
                        key={task.id} 
                        className={`h-10 flex items-center px-4 border-b ${
                          task.isGroup ? 'bg-gantt-gray' : 'bg-card'
                        } ${
                          dragOverTask?.id === task.id && dragOverPosition === 'above' 
                            ? 'border-t-2 border-t-primary' 
                            : dragOverTask?.id === task.id && dragOverPosition === 'below'
                            ? 'border-b-2 border-b-primary'
                            : ''
                        }`}
                        onDragOver={(e) => hasEditPermission ? handleTaskDragOver(e, task) : null}
                        onDragLeave={handleTaskDragLeave}
                      >
                        <div className="flex items-center w-full">
                          <div className="w-5 flex-shrink-0">
                            {task.isGroup && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-5 w-5 p-0"
                                onClick={() => toggleGroup(task.id)}
                              >
                                {expandedGroups[task.id] ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                          <div 
                            className={`ml-1 text-sm truncate flex-1 ${task.isGroup ? 'font-medium' : ''}`}
                            style={{ paddingLeft: task.parentId ? '12px' : '0px' }}
                          >
                            {task.name}
                          </div>
                          
                          {!task.isGroup && hasEditPermission && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-6 w-6 p-0 rounded-full ${createDependencyMode?.sourceId === task.id ? 'bg-yellow-200' : ''}`}
                              onClick={() => handleDependencyStartClick(task.id)}
                              title="Criar dependência a partir desta tarefa"
                            >
                              <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="overflow-auto flex-grow" style={{ minWidth: `${tableWidth}px` }}>
                <div className="flex h-12 border-b">
                  {months.map((month, idx) => (
                    <div 
                      key={idx} 
                      className="border-r flex items-center justify-center"
                      style={{ width: `${month.weeks * actualCellWidth}px` }}
                    >
                      <div className="text-sm font-medium text-foreground">{month.name}</div>
                    </div>
                  ))}
                </div>
                
                <div className="flex h-12 border-b">
                  {weeks.map((week, idx) => (
                    <div 
                      key={idx} 
                      className="border-r flex items-center justify-center"
                      style={{ width: `${actualCellWidth}px` }}
                    >
                      <div className="text-xs text-muted-foreground">{week}</div>
                    </div>
                  ))}
                </div>
                
                <div 
                  ref={ganttGridRef}
                  className={`gantt-grid relative ${createDependencyMode?.active ? 'dependency-mode' : ''}`}
                  style={{ height: `${visibleTasks.length * 40}px`, width: `${tableWidth}px` }}
                  onClick={handleGridClick}
                >
                  {visibleTasks.map((task, rowIndex) => (
                    <div 
                      key={task.id} 
                      className={`absolute h-10 w-full ${
                        dragOverTask?.id === task.id && dragOverPosition === 'above' 
                          ? 'border-t-2 border-t-primary' 
                          : dragOverTask?.id === task.id && dragOverPosition === 'below'
                          ? 'border-b-2 border-b-primary'
                          : ''
                      }`}
                      style={{ top: `${rowIndex * 40}px` }}
                      onDragOver={(e) => hasEditPermission ? handleTaskDragOver(e, task) : null}
                      onDragLeave={handleTaskDragLeave}
                    >
                      <div className="absolute inset-0 flex">
                        {Array.from({ length: totalCells }).map((_, weekIndex) => (
                          <div
                            key={weekIndex}
                            className={`h-full ${
                              dragOverCell?.weekIndex === weekIndex && dragOverCell?.rowIndex === rowIndex
                                ? 'bg-blue-100 dark:bg-blue-900/20'
                                : ''
                            }`}
                            style={{ width: `${actualCellWidth}px` }}
                            onDragOver={(e) => hasEditPermission ? handleCellDragOver(e, weekIndex, rowIndex) : null}
                            onDrop={(e) => hasEditPermission ? handleCellDrop(e, weekIndex, rowIndex) : null}
                          />
                        ))}
                      </div>
                      
                      <Task 
                        task={task}
                        style={getTaskStyle(task)}
                        onClick={() => handleTaskClick(task)}
                        onDragStart={hasEditPermission ? (e) => handleTaskDragStart(e, task) : undefined}
                        onDragEnd={hasEditPermission ? (e) => handleTaskDragEnd(e, task) : undefined}
                        cellWidth={actualCellWidth}
                        onResize={hasEditPermission ? (newDuration) => handleTaskResize(task, newDuration) : undefined}
                        className={createDependencyMode?.active ? 
                          createDependencyMode.sourceId === task.id ? 
                            'dependency-source' : 'dependency-target-candidate' 
                          : ''}
                        draggable={hasEditPermission}
                      />
                    </div>
                  ))}
                  
                  <svg className="absolute inset-0 h-full w-full pointer-events-none">
                    {visibleTasks.map(task => {
                      if (!task.dependencies?.length) return null;
                      
                      return task.dependencies.map(depId => {
                        const dependencyTask = visibleTasks.find(t => t.id === depId);
                        if (!dependencyTask || !isTaskVisible(dependencyTask)) return null;
                        
                        const fromIndex = visibleTasks.findIndex(t => t.id === depId);
                        const toIndex = visibleTasks.findIndex(t => t.id === task.id);
                        
                        if (fromIndex === -1 || toIndex === -1) return null;
                        
                        const fromStyle = getTaskStyle(dependencyTask);
                        const toStyle = getTaskStyle(task);
                        
                        const fromX = parseInt(fromStyle.marginLeft) + parseInt(fromStyle.width);
                        const fromY = fromIndex * 40 + 20;
                        
                        const toX = parseInt(toStyle.marginLeft);
                        const toY = toIndex * 40 + 20;
                        
                        const midX = (fromX + toX) / 2;
                        
                        return (
                          <path
                            key={`${depId}-${task.id}`}
                            className="gantt-connection"
                            d={`M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`}
                            markerEnd="url(#arrowhead)"
                          />
                        );
                      });
                    })}
                    
                    <defs>
                      <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                      >
                        <polygon points="0 0, 10 3.5, 0 7" fill="#FFB236" />
                      </marker>
                    </defs>
                  </svg>
                  
                  {createDependencyMode?.active && (
                    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-10">
                      <div className="absolute text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded shadow-sm">
                        Clique em uma tarefa para criar dependência
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Toggle sidebar button */}
              <div className="absolute left-0 top-1/2 z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleSidebar}
                  className="bg-card/70 hover:bg-card border-r border-t border-b rounded-l-none"
                  aria-label={sidebarVisible ? "Esconder lista de tarefas" : "Mostrar lista de tarefas"}
                >
                  {sidebarVisible ? (
                    <ChevronLeftSquare className="h-5 w-5" />
                  ) : (
                    <ChevronRightSquare className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          
          <div className="p-2 bg-card border-t flex flex-wrap justify-between items-center gap-2">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full mr-1"></div>
                  <span>Dependências</span>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                {priorityLegend.map(priority => (
                  <div key={priority.level} className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${priority.color} mr-1`}></div>
                    <span className="text-xs text-muted-foreground">{priority.label}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleZoomOut}
                  title="Diminuir Zoom"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground min-w-10 text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleZoomIn}
                  title="Aumentar Zoom"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {!createDependencyMode?.active && onAddTask && hasEditPermission && (
              <Button 
                variant="outline" 
                size="sm" 
                className="text-primary"
                onClick={onAddTask}
              >
                <Plus className="h-4 w-4 mr-1" />
                <span>Adicionar Tarefa</span>
              </Button>
            )}
            
            {createDependencyMode?.active && (
              <Button 
                variant="outline" 
                size="sm"
                className="text-yellow-600 border-yellow-300"
                onClick={() => setCreateDependencyMode(null)}
              >
                Cancelar criação de dependência
              </Button>
            )}
          </div>
        </div>
      </>
    </div>
  );
};

export default GanttChart;
