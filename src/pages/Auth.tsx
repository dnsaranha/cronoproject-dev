import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthForm } from "@/components/AuthForm";
import { CronoLogo } from "@/components/CronoLogo";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Moon, Sun, MonitorSmartphone } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export default function Auth() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  
  useEffect(() => {
    // Check if user is already signed in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // User is already logged in, redirect to dashboard
        navigate("/dashboard");
      }
    };
    
    checkUser();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate("/dashboard");
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      <header className="bg-background px-4 py-3 border-b">
        <div className="container mx-auto flex justify-between items-center">
          <CronoLogo size="md" />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                {theme === 'light' && <Sun className="h-5 w-5" />}
                {theme === 'dark' && <Moon className="h-5 w-5" />}
                {theme === 'system' && <MonitorSmartphone className="h-5 w-5" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" />
                <span>Modo Claro</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" />
                <span>Modo Escuro</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <MonitorSmartphone className="mr-2 h-4 w-4" />
                <span>Sistema</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      <div className="flex flex-col items-center justify-center flex-1 px-4 py-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center mb-6">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
              Bem-vindo ao CronoProject
            </h1>
            <p className="text-sm text-muted-foreground">
              Entre com seu email e senha para acessar sua conta
            </p>
          </div>
          
          <AuthForm />
        </div>
      </div>
    </div>
  );
}
