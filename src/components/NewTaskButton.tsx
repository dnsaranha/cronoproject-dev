
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface NewTaskButtonProps {
  onClick?: () => void;
}

const NewTaskButton = ({ onClick }: NewTaskButtonProps) => {
  return (
    <Button
      size="sm"
      className="bg-primary hover:bg-primary/90 text-white font-medium flex items-center transition-all duration-300 ease-spring hover:shadow-md"
      onClick={onClick}
    >
      <Plus className="h-4 w-4 mr-1" />
      Nova Tarefa
    </Button>
  );
};

export default NewTaskButton;
