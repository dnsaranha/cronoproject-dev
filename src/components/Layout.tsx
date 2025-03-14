
import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, Sun, Moon, MonitorSmartphone } from "lucide-react";
import { CronoLogo } from "@/components/CronoLogo";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Theme management
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(
    () => (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system'
  );
  
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Erro ao desconectar",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  const setThemePreference = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Apply theme immediately
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(newTheme);
    }
  };
  
  // Apply saved theme on initial load
  useState(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system';
    setThemePreference(savedTheme);
  });

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-background border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              className="p-0 mr-2"
              onClick={() => navigate('/')}
            >
              <CronoLogo size="md" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    {theme === 'light' && <Sun className="h-5 w-5" />}
                    {theme === 'dark' && <Moon className="h-5 w-5" />}
                    {theme === 'system' && <MonitorSmartphone className="h-5 w-5" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setThemePreference('light')}>
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Modo Claro</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setThemePreference('dark')}>
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Modo Escuro</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setThemePreference('system')}>
                    <MonitorSmartphone className="mr-2 h-4 w-4" />
                    <span>Sistema</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <div className="hidden sm:flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {menuOpen && (
            <div className="mt-2 sm:hidden bg-background rounded-md shadow-md p-3 absolute right-4 z-10 w-[200px] border">
              <div className="flex flex-col space-y-2">
                <Button 
                  variant="ghost" 
                  onClick={handleSignOut}
                  className="justify-start w-full"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>
      
      <main className="flex-1 bg-background">
        {children}
      </main>
    </div>
  );
}
