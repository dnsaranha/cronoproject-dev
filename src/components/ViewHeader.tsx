
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ReactNode } from "react";

interface ViewHeaderProps {
  title: string;
  onAddItem: () => void;
  buttonText?: string;
  extraActions?: ReactNode;
  hideAddButton?: boolean;
}

const ViewHeader = ({ 
  title, 
  onAddItem, 
  buttonText = "Nova Tarefa", 
  extraActions, 
  hideAddButton = false 
}: ViewHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-2">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-end">
        {extraActions}
        {!hideAddButton && (
          <Button 
            size="sm"
            className="bg-primary hover:bg-primary/90 text-white font-medium"
            onClick={onAddItem}
          >
            <Plus className="h-4 w-4 mr-1" />
            {buttonText}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ViewHeader;
