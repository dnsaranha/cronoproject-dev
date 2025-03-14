
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface EmptyTaskStateProps {
  onAddTask: () => void;
  hideAddButton?: boolean;
}

const EmptyTaskState = ({ onAddTask, hideAddButton = false }: EmptyTaskStateProps) => {
  return (
    <div className="border rounded-md p-8 flex flex-col items-center justify-center text-center space-y-4 bg-card">
      <div className="text-4xl">📋</div>
      <h3 className="text-xl font-semibold">Nenhuma tarefa encontrada</h3>
      <p className="text-muted-foreground max-w-md">
        {hideAddButton 
          ? "Este projeto ainda não possui tarefas definidas." 
          : "Este projeto ainda não possui tarefas. Comece adicionando sua primeira tarefa."}
      </p>
      
      {!hideAddButton && (
        <Button onClick={onAddTask} className="mt-4">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Tarefa
        </Button>
      )}
    </div>
  );
};

export default EmptyTaskState;
