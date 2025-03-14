
import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { TaskType } from './Task';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Clock, CalendarDays, ArrowRight } from 'lucide-react';

export interface TaskNodeData {
  task: TaskType;
  isCritical: boolean;
  earlyStart: number;
  earlyFinish: number;
  lateStart: number;
  lateFinish: number;
  float: number;
  hasEditPermission: boolean;
}

interface TaskNodeProps {
  data: TaskNodeData;
}

export const TaskNode = memo(({ data }: TaskNodeProps) => {
  const { 
    task, 
    isCritical, 
    earlyStart, 
    earlyFinish, 
    lateStart, 
    lateFinish, 
    float, 
    hasEditPermission 
  } = data;

  // Create a simple ID label (e.g., A, B, C) based on task name
  const idLabel = task.name.charAt(0).toUpperCase();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`px-4 py-3 rounded-md shadow-md w-60 border-2 ${
              isCritical 
                ? 'bg-red-50 dark:bg-red-950/30 border-red-500 dark:border-red-600' 
                : 'bg-blue-50 dark:bg-blue-950/30 border-blue-500 dark:border-blue-600'
            } ${hasEditPermission ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <Handle
              type="target"
              position={Position.Left}
              className={`w-3 h-3 ${isCritical ? 'bg-red-500' : 'bg-blue-500'}`}
            />
            
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 flex items-center justify-center text-xl font-bold w-10 h-10 rounded-full ${
                isCritical 
                  ? 'bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-200' 
                  : 'bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-200'
              }`}>
                {idLabel}
              </div>
              
              <div className="flex-1 overflow-hidden">
                <div className="font-semibold truncate mb-1">{task.name}</div>
                
                <div className="flex items-center text-xs gap-1 mb-1">
                  <Clock className="h-3 w-3" />
                  <span>Duração: {task.duration} dias</span>
                </div>
                
                <div className={`text-xs px-1.5 py-0.5 rounded-sm inline-flex items-center ${
                  isCritical 
                    ? 'bg-red-200 dark:bg-red-800/50 text-red-700 dark:text-red-200' 
                    : 'bg-blue-200 dark:bg-blue-800/50 text-blue-700 dark:text-blue-200'
                }`}>
                  Folga: {float} dias
                </div>
              </div>
            </div>
            
            <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
              <div className="border dark:border-gray-700 rounded px-1.5 py-1 bg-white dark:bg-gray-900">
                <div className="font-medium">ID</div>
                <div>{earlyStart}/{earlyFinish}</div>
              </div>
              <div className="border dark:border-gray-700 rounded px-1.5 py-1 bg-white dark:bg-gray-900">
                <div className="font-medium">IT</div>
                <div>{lateStart}/{lateFinish}</div>
              </div>
            </div>
            
            <Handle
              type="source"
              position={Position.Right}
              className={`w-3 h-3 ${isCritical ? 'bg-red-500' : 'bg-blue-500'}`}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm">
          <div className="space-y-2 p-1">
            <div className="font-semibold">{task.name}</div>
            {task.description && <p className="text-sm">{task.description}</p>}
            
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                <span>Duração: {task.duration} dias</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>Início: {new Date(task.startDate).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="h-3.5 w-3.5" />
                <span>Progresso: {task.progress}%</span>
              </div>
            </div>
            
            <div className="text-xs mt-1">
              {isCritical 
                ? "Esta é uma tarefa crítica. Qualquer atraso impactará o projeto."
                : `Esta tarefa tem ${float} dias de folga.`
              }
            </div>
            
            {hasEditPermission && (
              <div className="text-xs italic mt-1">
                Clique para editar esta tarefa no gráfico de Gantt
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

TaskNode.displayName = 'TaskNode';
