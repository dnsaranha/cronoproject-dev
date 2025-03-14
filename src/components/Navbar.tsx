import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar, Layout, BarChart, Trello } from "lucide-react";
import { CronoLogo } from "@/components/CronoLogo";
import { Link } from "react-router-dom";

interface NavItem {
  name: string;
  icon: React.ReactNode;
  path: string;
}

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems: NavItem[] = [
    { name: "Gantt", icon: <Calendar className="h-4 w-4 mr-2" />, path: "/" },
    { name: "Grade", icon: <Layout className="h-4 w-4 mr-2" />, path: "/grade" },
    { name: "Linha do Tempo", icon: <BarChart className="h-4 w-4 mr-2" />, path: "/linha-do-tempo" },
    { name: "Quadro", icon: <Trello className="h-4 w-4 mr-2" />, path: "/quadro" },
  ];

  return (
    <header className="border-b bg-background">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/dashboard" className="flex items-center">
          <CronoLogo />
          <span className="ml-2 font-bold">Project</span>
        </Link>
        
        <div className="flex space-x-1">
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              className={cn(
                "nav-item flex items-center px-3 py-2 text-sm font-medium",
                currentPath === item.path && "text-primary font-semibold active"
              )}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              {item.name}
            </Button>
          ))}
        </div>

        <div className="ml-auto flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <span className="sr-only">More options</span>
            <span className="font-medium text-sm">Mais</span>
          </Button>
          
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 text-white font-medium flex items-center"
          >
            <span className="mr-1">+</span> Nova Tarefa
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
