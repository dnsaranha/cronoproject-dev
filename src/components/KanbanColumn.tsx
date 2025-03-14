
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskType } from "@/components/Task";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface KanbanColumnProps {
  title: string;
  tasks: TaskType[];
  onDrop: (taskId: string) => void;
  onEditTask: (task: TaskType) => void;
  onEditColumn?: (columnId: string) => void;
  onDeleteColumn?: (columnId: string) => void;
  columnId: string; 
  totalColumns: number;
}

const KanbanColumn = ({ 
  title, 
  tasks, 
  onDrop, 
  onEditTask, 
  onEditColumn,
  onDeleteColumn,
  columnId,
  totalColumns
}: KanbanColumnProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  
  const handleDragLeave = () => {
    setIsDragOver(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onDrop(taskId);
    }
  };
  
  const handleDeleteClick = () => {
    setShowDeleteAlert(true);
  };
  
  const handleConfirmDelete = () => {
    if (onDeleteColumn) {
      onDeleteColumn(columnId);
    }
    setShowDeleteAlert(false);
  };

  return (
    <div 
      className={`board-column ${isDragOver ? 'drop-zone drag-over' : ''} flex flex-col min-w-[280px] h-full rounded-md bg-gray-50 dark:bg-gray-800 border p-2`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex justify-between items-center mb-2 p-2">
        <h3 className="font-medium text-lg">{title}</h3>
        
        {(onEditColumn || onDeleteColumn) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEditColumn && (
                <DropdownMenuItem onClick={() => onEditColumn(columnId)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Coluna
                </DropdownMenuItem>
              )}
              {onDeleteColumn && totalColumns > 2 && (
                <DropdownMenuItem 
                  onClick={handleDeleteClick}
                  className="text-red-500 focus:text-red-500"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Coluna
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      <div className="space-y-2 overflow-auto flex-1 p-1">
        {tasks.map(task => (
          <Card 
            key={task.id}
            className="board-card cursor-pointer"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('taskId', task.id);
              e.currentTarget.classList.add('task-dragging');
            }}
            onDragEnd={(e) => {
              e.currentTarget.classList.remove('task-dragging');
            }}
            onClick={() => onEditTask(task)}
          >
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-base font-medium">{task.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {task.isMilestone ? (
                  <span className="inline-flex items-center text-purple-600 dark:text-purple-400">
                    <span className="mr-1">●</span> Marco
                  </span>
                ) : (
                  <>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div 
                          className="bg-blue-500 h-1.5 rounded-full" 
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                      <div className="mt-1">{task.progress}% concluído</div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {tasks.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">
            Arraste tarefas para esta coluna
          </div>
        )}
      </div>
      
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Coluna</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta coluna? Todas as tarefas desta coluna serão movidas para a primeira coluna.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default KanbanColumn;
