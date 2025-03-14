import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import LoadingState from "@/components/LoadingState";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Componente que protege rotas para usuários autenticados
 * Redireciona para a página de login se o usuário não estiver autenticado
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();
  
  useEffect(() => {
    const checkAuth = async () => {
      // Verificar se o usuário está autenticado
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      
      if (session) {
        setUser(session.user);
      }
      
      setLoading(false);
    };
    
    checkAuth();
    
    // Listener para mudanças na autenticação
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);
  
  if (loading) {
    return <LoadingState />;
  }
  
  // Se não estiver autenticado, redirecionar para o login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Se estiver autenticado, renderizar os filhos
  return <>{children}</>;
} 