
import { useState } from "react";
import * as XLSX from "xlsx";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskType } from "@/components/Task";
import { useToast } from "@/components/ui/use-toast";

interface ExcelExportImportProps {
  tasks: TaskType[];
  projectId: string;
  onImport?: (tasksToUpdate: TaskType[], tasksToCreate: Omit<TaskType, 'id'>[]) => Promise<boolean>;
}

const ExcelExportImport = ({ tasks, projectId, onImport }: ExcelExportImportProps) => {
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  // Export tasks to Excel
  const handleExport = () => {
    console.log("Starting export of tasks:", tasks);
    if (!tasks || tasks.length === 0) {
      toast({
        title: "Nenhuma tarefa para exportar",
        description: "Adicione tarefas ao projeto antes de exportar.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Map tasks to a format suitable for Excel
      const excelData = tasks.map((task) => ({
        ID: task.id,
        Nome: task.name,
        'Data de Início': task.startDate,
        'Duração (dias)': task.duration,
        'Progresso (%)': task.progress || 0,
        'É Grupo': task.isGroup ? 'Sim' : 'Não',
        'É Marco': task.isMilestone ? 'Sim' : 'Não',
        'ID do Pai': task.parentId || '',
        'Dependências': task.dependencies ? task.dependencies.join(', ') : '',
        'Responsáveis': task.assignees ? task.assignees.join(', ') : ''
      }));

      console.log("Formatted data for export:", excelData);

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Create workbook and add the worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Tarefas");
      
      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      
      // Create blob from buffer
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Create download link and trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `projeto_${projectId}_tarefas.xlsx`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Exportação concluída",
        description: "O arquivo Excel foi gerado com sucesso.",
      });
    } catch (error) {
      console.error("Erro na exportação:", error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível gerar o arquivo Excel.",
        variant: "destructive",
      });
    }
  };

  // Import tasks from Excel
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    setIsImporting(true);
    const file = event.target.files[0];
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          if (!data) throw new Error("Falha ao ler arquivo");
          
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          console.log("Imported data:", jsonData);
          
          if (jsonData.length === 0) {
            throw new Error("O arquivo não contém dados de tarefas");
          }
          
          // Process imported data
          const existingTasksToUpdate: TaskType[] = [];
          const newTasksToCreate: Omit<TaskType, 'id'>[] = [];
          
          jsonData.forEach((row: any) => {
            // Create task object from row
            const taskData = {
              name: row['Nome'] || 'Tarefa Importada',
              startDate: row['Data de Início'] || new Date().toISOString().split('T')[0],
              duration: parseInt(row['Duração (dias)'] || '7'),
              progress: parseInt(row['Progresso (%)'] || '0'),
              isGroup: row['É Grupo'] === 'Sim',
              isMilestone: row['É Marco'] === 'Sim',
              parentId: row['ID do Pai'] || undefined,
              dependencies: row['Dependências'] ? 
                row['Dependências'].split(',').map((id: string) => id.trim()) : [],
              assignees: row['Responsáveis'] ? 
                row['Responsáveis'].split(',').map((id: string) => id.trim()) : []
            };
            
            // Check if task has ID and exists in current tasks
            if (row['ID'] && tasks.some(t => t.id === row['ID'])) {
              existingTasksToUpdate.push({
                ...taskData,
                id: row['ID']
              } as TaskType);
            } else {
              // Task is new or ID doesn't match existing tasks
              newTasksToCreate.push(taskData);
            }
          });
          
          console.log("Tasks to update:", existingTasksToUpdate);
          console.log("Tasks to create:", newTasksToCreate);
          
          // Call the onImport callback if provided
          if (onImport) {
            const success = await onImport(existingTasksToUpdate, newTasksToCreate);
            
            if (success) {
              toast({
                title: "Importação concluída",
                description: `${existingTasksToUpdate.length} tarefas atualizadas, ${newTasksToCreate.length} tarefas criadas.`,
              });
            }
          } else {
            toast({
              title: "Importação não suportada",
              description: "A função de importação não está disponível.",
              variant: "destructive",
            });
          }
        } catch (error: any) {
          console.error("Erro ao processar arquivo:", error);
          toast({
            title: "Erro na importação",
            description: error.message || "Falha ao processar o arquivo Excel.",
            variant: "destructive",
          });
        } finally {
          setIsImporting(false);
          // Clear input
          event.target.value = '';
        }
      };
      
      reader.readAsArrayBuffer(file);
    } catch (error: any) {
      console.error("Erro ao ler arquivo:", error);
      toast({
        title: "Erro na importação",
        description: error.message || "Falha ao ler o arquivo.",
        variant: "destructive",
      });
      setIsImporting(false);
      // Clear input
      event.target.value = '';
    }
  };

  return (
    <div className="flex space-x-2">
      <Button
        variant="outline"
        size="sm"
        className="text-xs"
        onClick={handleExport}
      >
        <Download className="h-3.5 w-3.5 mr-1" />
        Exportar Excel
      </Button>
      
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          disabled={isImporting}
          onClick={() => document.getElementById('excel-import')?.click()}
        >
          <Upload className="h-3.5 w-3.5 mr-1" />
          {isImporting ? "Importando..." : "Importar Excel"}
        </Button>
        <input
          id="excel-import"
          type="file"
          className="absolute inset-0 opacity-0 cursor-pointer"
          accept=".xlsx, .xls"
          onChange={handleImport}
          disabled={isImporting}
        />
      </div>
    </div>
  );
};

export default ExcelExportImport;
