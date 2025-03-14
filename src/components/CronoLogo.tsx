
import { Clock } from "lucide-react";

interface CronoLogoProps {
  size?: "sm" | "md" | "lg";
  withText?: boolean;
}

export function CronoLogo({ size = "md", withText = true }: CronoLogoProps) {
  const getSize = () => {
    switch (size) {
      case "sm": return { icon: 20, fontSize: "text-lg" };
      case "lg": return { icon: 36, fontSize: "text-3xl" };
      default: return { icon: 28, fontSize: "text-2xl" };
    }
  };
  
  const { icon, fontSize } = getSize();
  
  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <Clock size={icon} className="text-primary" strokeWidth={2} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[30%] h-[30%] bg-primary-foreground rounded-full"></div>
        </div>
      </div>
      
      {withText && (
        <h1 className={`font-bold ${fontSize} text-primary tracking-tight`}>
          Crono<span className="text-slate-600">Project</span>
        </h1>
      )}
    </div>
  );
}
