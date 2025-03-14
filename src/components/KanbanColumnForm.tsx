
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

export interface KanbanColumnData {
  id: string;
  title: string;
  progressMin?: number;
  progressMax?: number;
}

interface KanbanColumnFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (column: KanbanColumnData) => void;
  column?: KanbanColumnData | null;
  isNew?: boolean;
}

const KanbanColumnForm = ({ 
  open, 
  onOpenChange, 
  onSubmit, 
  column, 
  isNew = false 
}: KanbanColumnFormProps) => {
  const [formData, setFormData] = useState<KanbanColumnData>({
    id: "",
    title: "",
    progressMin: 0,
    progressMax: 100,
  });
  
  const [progressRange, setProgressRange] = useState<[number, number]>([0, 100]);

  useEffect(() => {
    if (column) {
      setFormData({
        ...column
      });
      setProgressRange([
        column.progressMin || 0, 
        column.progressMax || 100
      ]);
    } else if (isNew) {
      setFormData({
        id: `column_${Date.now()}`,
        title: "",
        progressMin: 0,
        progressMax: 100,
      });
      setProgressRange([0, 100]);
    }
  }, [column, isNew, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalFormData = {
      ...formData,
      progressMin: progressRange[0],
      progressMax: progressRange[1]
    };
    
    onSubmit(finalFormData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isNew ? 'Nova Coluna' : 'Editar Coluna'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Nome da Coluna</Label>
            <Input 
              id="title" 
              value={formData.title} 
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Digite o nome da coluna"
              required
            />
          </div>
          
          <div className="space-y-4">
            <Label>Intervalo de Progresso ({progressRange[0]}% - {progressRange[1]}%)</Label>
            <Slider
              value={progressRange}
              min={0}
              max={100}
              step={5}
              onValueChange={(value) => setProgressRange(value as [number, number])}
              className="my-6"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
            <p className="text-sm text-muted-foreground">
              As tarefas com progresso neste intervalo serão automaticamente movidas para esta coluna.
            </p>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {isNew ? 'Criar Coluna' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default KanbanColumnForm;
