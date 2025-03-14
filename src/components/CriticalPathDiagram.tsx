
import { useEffect, useState } from 'react';
import { 
  ReactFlow, 
  Node, 
  Edge, 
  Position,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  Panel,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TaskType } from './Task';
import { TaskNodeData, TaskNode } from './TaskNode';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

interface EnhancedTaskType extends TaskType {
  earlyStart: number;
  earlyFinish: number;
  lateStart: number;
  lateFinish: number;
  float: number;
}

interface ConnectionType {
  source: string;
  target: string;
  isCritical: boolean;
}

interface CriticalPathDiagramProps {
  criticalTasks: EnhancedTaskType[];
  nonCriticalTasks: EnhancedTaskType[];
  connections: ConnectionType[];
  hasEditPermission: boolean;
}

// Define node types for the flow
const nodeTypes = {
  taskNode: TaskNode,
};

export default function CriticalPathDiagram({ 
  criticalTasks, 
  nonCriticalTasks,
  connections,
  hasEditPermission
}: CriticalPathDiagramProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLayouting, setIsLayouting] = useState(true);

  // Initialize the diagram with tasks and connections
  useEffect(() => {
    if (!criticalTasks || !nonCriticalTasks) return;
    
    setIsLayouting(true);
    
    // Calculate positions - horizontal layout
    const allTasks = [...criticalTasks, ...nonCriticalTasks];
    
    // Organize tasks by their early start time for horizontal positioning
    // We need to group tasks by earlyStart manually since Object.groupBy might not be available
    const tasksByEarlyStart: Record<number, EnhancedTaskType[]> = {};
    allTasks.forEach(task => {
      const earlyStart = task.earlyStart;
      if (!tasksByEarlyStart[earlyStart]) {
        tasksByEarlyStart[earlyStart] = [];
      }
      tasksByEarlyStart[earlyStart].push(task);
    });
    
    const timeSlots = Object.keys(tasksByEarlyStart).map(Number).sort((a, b) => a - b);
    
    // Calculate spacing
    const horizontalGap = 280; // px between columns
    const verticalGap = 120;   // px between rows
    
    // Create nodes for each task
    const flowNodes: Node[] = [];
    
    // Layout nodes in columns by early start time
    timeSlots.forEach((timeSlot, columnIndex) => {
      const tasksInSlot = tasksByEarlyStart[timeSlot];
      
      tasksInSlot.forEach((task, rowIndex) => {
        const isCritical = criticalTasks.some(t => t.id === task.id);
        
        // Create node data with task information and make it compatible with Record<string, unknown>
        const nodeData: TaskNodeData = {
          task: task,
          isCritical,
          earlyStart: task.earlyStart,
          earlyFinish: task.earlyFinish,
          lateStart: task.lateStart,
          lateFinish: task.lateFinish,
          float: task.float,
          hasEditPermission,
        };
        
        // Create the node
        flowNodes.push({
          id: task.id,
          type: 'taskNode',
          data: nodeData as unknown as Record<string, unknown>,
          position: { 
            x: columnIndex * horizontalGap + 50, 
            y: rowIndex * verticalGap + 50
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });
      });
    });
    
    // Create edges for connections
    const flowEdges: Edge[] = connections.map((connection) => ({
      id: `e-${connection.source}-${connection.target}`,
      source: connection.source,
      target: connection.target,
      animated: false,
      style: { 
        stroke: connection.isCritical ? '#ef4444' : '#3b82f6',
        strokeWidth: connection.isCritical ? 3 : 2
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: connection.isCritical ? '#ef4444' : '#3b82f6',
      },
    }));
    
    // Update the flow with nodes and edges
    setNodes(flowNodes);
    setEdges(flowEdges);
    setIsLayouting(false);
  }, [criticalTasks, nonCriticalTasks, connections, hasEditPermission, setNodes, setEdges]);

  // Handle node click to navigate to task edit
  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    if (!hasEditPermission) return;
    
    const taskId = node.id;
    
    // Navigate to gantt view with this task highlighted for editing
    navigate(`../gantt?taskId=${taskId}`);
    
    toast({
      title: "Editar Tarefa",
      description: "Navegando para a edição desta tarefa no gráfico de Gantt.",
    });
  };

  return (
    <div style={{ width: '100%', height: '500px' }} className="relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
        <Panel position="top-left" className="bg-transparent">
          {isLayouting && (
            <div className="text-sm text-muted-foreground">
              Organizando diagrama...
            </div>
          )}
        </Panel>
      </ReactFlow>
    </div>
  );
}
