
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TaskType } from "@/components/Task";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar as CalendarIcon, Flag, Users, AlertTriangle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: TaskType | null;
  onSubmit: (task: Partial<TaskType>) => void;
  tasks: TaskType[];
  isNew?: boolean;
  projectMembers?: Array<{ id: string; name: string; email: string }>;
  readOnly?: boolean;
}

const TaskForm = ({ 
  open, 
  onOpenChange, 
  task, 
  onSubmit, 
  tasks, 
  isNew = false,
  projectMembers = [] 
}: TaskFormProps) => {
  const [formData, setFormData] = useState<Partial<TaskType>>({
    name: "",
    startDate: new Date().toISOString().split("T")[0],
    duration: 1,
    progress: 0,
    dependencies: [],
    assignees: [],
    isGroup: false,
    isMilestone: false,
    priority: 3
  });

  // When task changes, update form data
  useEffect(() => {
    if (task) {
      setFormData({
        ...task
      });
    } else if (isNew) {
      // Reset form for new task
      setFormData({
        name: "",
        startDate: new Date().toISOString().split("T")[0],
        duration: 1,
        progress: 0,
        dependencies: [],
        assignees: [],
        isGroup: false,
        isMilestone: false,
        priority: 3
      });
    }
  }, [task, isNew]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Guarantee the required fields are present
    const finalFormData = {
      ...formData,
      name: formData.name || "Nova Tarefa",
      startDate: formData.startDate || new Date().toISOString().split("T")[0],
      priority: formData.priority || 3
    };

    // Set appropriate duration for milestones
    if (formData.isMilestone) {
      finalFormData.duration = 0;
    }

    onSubmit(finalFormData);
    onOpenChange(false);
  };

  const handleChange = (field: string, value: any) => {
    // Special handling for milestone toggle
    if (field === 'isMilestone' && value === true) {
      setFormData({
        ...formData,
        isMilestone: true,
        isGroup: false, // Can't be both
        duration: 0 // Milestones have no duration
      });
    } else if (field === 'isGroup' && value === true) {
      setFormData({
        ...formData,
        isGroup: true,
        isMilestone: false // Can't be both
      });
    } else {
      setFormData({
        ...formData,
        [field]: value
      });
    }
  };

  // Filter tasks that could be dependencies (no circular dependencies)
  const availableDependencies = tasks.filter(t => 
    t.id !== formData.id && 
    !isCircularDependency(t.id, formData.id, tasks)
  );

  // Function to check if adding a dependency would create a circular dependency
  function isCircularDependency(sourceId: string, targetId: string, allTasks: TaskType[], visited: Set<string> = new Set()): boolean {
    // If we've already visited this task in this path, we have a cycle
    if (visited.has(sourceId)) return false;
    
    const source = allTasks.find(t => t.id === sourceId);
    if (!source) return false;

    // Mark current task as visited in this path
    visited.add(sourceId);
    
    // Check if any of source's dependencies is the target (would create a cycle)
    if (source.dependencies?.includes(targetId)) return true;
    
    // Recursively check each dependency
    if (source.dependencies) {
      for (const depId of source.dependencies) {
        if (isCircularDependency(depId, targetId, allTasks, new Set(visited))) {
          return true;
        }
      }
    }
    
    return false;
  }

  const toggleDependency = (depId: string) => {
    const currentDeps = formData.dependencies || [];
    if (currentDeps.includes(depId)) {
      handleChange('dependencies', currentDeps.filter(id => id !== depId));
    } else {
      handleChange('dependencies', [...currentDeps, depId]);
    }
  };

  const toggleAssignee = (userId: string) => {
    const currentAssignees = formData.assignees || [];
    if (currentAssignees.includes(userId)) {
      handleChange('assignees', currentAssignees.filter(id => id !== userId));
    } else {
      handleChange('assignees', [...currentAssignees, userId]);
    }
  };
  
  // To get parent task options
  const parentTaskOptions = tasks.filter(t => 
    t.isGroup && t.id !== formData.id
  );
  
  // For date selection to select the next day
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      handleChange('startDate', date.toISOString().split('T')[0]);
    }
  };

  // Priority options
  const priorityOptions = [
    { value: 1, label: "Muito Baixa", color: "bg-gray-400" },
    { value: 2, label: "Baixa", color: "bg-blue-400" },
    { value: 3, label: "Média", color: "bg-green-400" },
    { value: 4, label: "Alta", color: "bg-yellow-400" },
    { value: 5, label: "Muito Alta", color: "bg-red-400" }
  ];
  
  // Get priority color
  const getPriorityColor = (priority: number = 3) => {
    return priorityOptions.find(p => p.value === priority)?.color || "bg-green-400";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isNew ? 'Nova Tarefa' : 'Editar Tarefa'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Tarefa</Label>
            <Input 
              id="name" 
              value={formData.name || ''} 
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="isGroup"
                checked={formData.isGroup || false}
                onCheckedChange={(checked) => handleChange('isGroup', checked)}
                disabled={formData.isMilestone}
              />
              <Label htmlFor="isGroup">Grupo de Tarefas</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isMilestone"
                checked={formData.isMilestone || false}
                onCheckedChange={(checked) => handleChange('isMilestone', checked)}
                disabled={formData.isGroup}
              />
              <Label htmlFor="isMilestone" className="flex items-center">
                <Flag className="h-4 w-4 mr-1" />
                Marco
              </Label>
            </div>
          </div>
          
          {parentTaskOptions.length > 0 && !formData.isGroup && (
            <div className="space-y-2">
              <Label htmlFor="parentId">Grupo/Pai</Label>
              <select
                id="parentId"
                value={formData.parentId || ''}
                onChange={(e) => handleChange('parentId', e.target.value || undefined)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="">-- Nenhum --</option>
                {parentTaskOptions.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="priority" className="flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Prioridade
            </Label>
            <Select
              value={String(formData.priority || 3)}
              onValueChange={(value) => handleChange('priority', Number(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a prioridade" />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map(option => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${option.color} mr-2`}></div>
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="startDate"
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !formData.startDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(new Date(formData.startDate), "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.startDate ? new Date(formData.startDate) : undefined}
                    onSelect={handleDateSelect}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {!formData.isMilestone && (
              <div className="space-y-2">
                <Label htmlFor="duration">Duração (dias)</Label>
                <Input 
                  id="duration" 
                  type="number" 
                  min="1"
                  value={formData.duration || 1} 
                  onChange={(e) => handleChange('duration', parseInt(e.target.value) || 1)}
                />
              </div>
            )}
          </div>
          
          {!formData.isMilestone && (
            <div className="space-y-2">
              <Label>Progresso ({formData.progress || 0}%)</Label>
              <Slider
                min={0}
                max={100}
                step={5}
                value={[formData.progress || 0]}
                onValueChange={(value) => handleChange('progress', value[0])}
              />
            </div>
          )}
          
          {/* Assignees section */}
          {projectMembers.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                Responsáveis
              </Label>
              <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto p-2 border rounded-md">
                {projectMembers.map(member => (
                  <div key={member.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`assign-${member.id}`} 
                      checked={formData.assignees?.includes(member.id) || false}
                      onCheckedChange={() => toggleAssignee(member.id)}
                    />
                    <label htmlFor={`assign-${member.id}`} className="text-sm truncate">
                      {member.name}
                    </label>
                  </div>
                ))}
              </div>
              
              {formData.assignees && formData.assignees.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {formData.assignees.map(userId => {
                    const member = projectMembers.find(m => m.id === userId);
                    return member && (
                      <Badge key={userId} variant="outline" className="flex items-center gap-1">
                        {member.name}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          
          {formData.id && !formData.isGroup && !formData.isMilestone && (
            <div className="space-y-2">
              <Label>Dependências</Label>
              <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto p-2 border rounded-md">
                {availableDependencies.length > 0 ? (
                  availableDependencies.map(depTask => (
                    <div key={depTask.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`dep-${depTask.id}`} 
                        checked={formData.dependencies?.includes(depTask.id) || false}
                        onCheckedChange={() => toggleDependency(depTask.id)}
                      />
                      <label htmlFor={`dep-${depTask.id}`} className="text-sm">
                        {depTask.name}
                      </label>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 col-span-2 text-center py-2">
                    Não há tarefas disponíveis para dependência
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button type="submit" variant="default">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskForm;
