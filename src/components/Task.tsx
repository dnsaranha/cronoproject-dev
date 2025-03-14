import { useState, useRef } from "react";
import { ChevronRight } from "lucide-react";
import { cva } from "class-variance-authority";

export interface TaskType {
  id: string;
  name: string;
  startDate: string;
  duration: number;
  progress: number;
  dependencies?: string[];
  assignees?: string[];
  parentId?: string;
  isGroup?: boolean;
  isMilestone?: boolean;
  priority?: 1 | 2 | 3 | 4 | 5;
  description?: string;
}

interface TaskProps {
  task: TaskType;
  style?: React.CSSProperties;
  onClick?: () => void;
  onResize?: (newDuration: number) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  cellWidth?: number;
  className?: string;
  draggable?: boolean;
}

const taskVariants = cva("gantt-task cursor-pointer absolute top-0 rounded-sm shadow-sm text-xs overflow-hidden transition-shadow duration-200", {
  variants: {
    priority: {
      1: "bg-gray-200 dark:bg-gray-700",      // Very Low
      2: "bg-blue-200 dark:bg-blue-800",      // Low
      3: "bg-green-200 dark:bg-green-800",    // Medium
      4: "bg-yellow-200 dark:bg-yellow-800",  // High
      5: "bg-red-200 dark:bg-red-800",        // Very High
    },
    type: {
      normal: "h-8 mt-1",
      group: "h-5 mt-[10px] bg-gantt-group-bg dark:bg-gray-700",
      milestone: "h-0 w-0 mt-[20px] shadow-none transform-origin-center"
    }
  },
  defaultVariants: {
    priority: 3,
    type: "normal"
  }
});

const Task = ({ 
  task, 
  style, 
  onClick, 
  onResize, 
  onDragStart, 
  onDragEnd,
  cellWidth = 30,
  className = "",
  draggable = true
}: TaskProps) => {
  const resizeHandleRef = useRef<HTMLDivElement | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [originalWidth, setOriginalWidth] = useState(0);

  const handleResizeStart = (e: React.MouseEvent) => {
    if (!onResize) return;
    
    e.stopPropagation();
    setIsResizing(true);
    setResizeStartX(e.clientX);
    setOriginalWidth(parseInt(style?.width?.toString() || "0"));
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const diff = e.clientX - resizeStartX;
      const newWidth = Math.max(cellWidth * 0.5, originalWidth + diff); // Minimum width is half a cell
      
      const newDuration = Math.ceil((newWidth / cellWidth) * 7);
      
      if (resizeHandleRef.current?.parentElement) {
        resizeHandleRef.current.parentElement.style.width = `${newWidth}px`;
      }
    };
    
    const handleMouseUp = () => {
      if (!isResizing || !onResize) return;
      
      setIsResizing(false);
      
      if (resizeHandleRef.current?.parentElement) {
        const newWidth = parseInt(resizeHandleRef.current.parentElement.style.width);
        const newDuration = Math.max(1, Math.ceil((newWidth / cellWidth) * 7));
        onResize(newDuration);
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (task.isMilestone) {
    return (
      <div 
        className={`gantt-milestone absolute cursor-pointer top-[12px] ${className}`}
        style={{
          ...style,
          width: 0,
          height: 0,
          marginLeft: `${parseInt(style?.marginLeft?.toString() || "0") - 8}px`,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderBottom: '16px solid purple',
        }}
        onClick={onClick}
        draggable={draggable && !!onDragStart}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />
    );
  }
  
  // Calculate priority for styling - make sure it's a valid value
  const priority = (task.priority || 3) as 1 | 2 | 3 | 4 | 5;
  
  return (
    <div 
      className={`${taskVariants({
        priority, 
        type: task.isGroup ? "group" : "normal"
      })} ${className}`}
      style={style}
      onClick={onClick}
      draggable={draggable && !!onDragStart}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {!task.isGroup && !task.isMilestone && (
        <div 
          className="absolute inset-0 bg-foreground/5 z-0"
          style={{ width: `${task.progress}%` }}
        />
      )}
      
      <div className="relative z-10 p-1 flex items-center justify-between h-full truncate">
        <div className="truncate text-xs">
          {task.name}
        </div>
        
        {!task.isGroup && !task.isMilestone && onResize && (
          <div 
            ref={resizeHandleRef}
            className="absolute top-0 right-0 w-2 h-full cursor-ew-resize opacity-0 hover:opacity-100 bg-gray-400 hover:bg-gray-600"
            onMouseDown={handleResizeStart}
            onTouchStart={(e) => {
              // Handle touch for mobile
              e.stopPropagation();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Task;
