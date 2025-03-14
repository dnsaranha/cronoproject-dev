import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Tipos de planos disponíveis
export type PlanType = 'free' | 'premium';

// Limites para cada tipo de plano
export const PLAN_LIMITS = {
  free: {
    maxProjects: 3,
    maxUsersPerProject: 5,
    storagePerUser: 100, // MB
    hasAdvancedGantt: false,
    hasIntegrations: false,
    hasAdvancedReports: false,
    hasPrioritySupport: false,
  },
  premium: {
    maxProjects: Infinity,
    maxUsersPerProject: Infinity,
    storagePerUser: 5000, // MB (5GB)
    hasAdvancedGantt: true,
    hasIntegrations: true,
    hasAdvancedReports: true,
    hasPrioritySupport: true,
  },
};

// Interface para o contexto de assinatura
interface SubscriptionContextType {
  userPlan: PlanType;
  isLoading: boolean;
  canCreateProject: (currentProjectCount: number) => boolean;
  canAddUserToProject: (currentUserCount: number) => boolean;
  canUseAdvancedGantt: () => boolean;
  canUseIntegrations: () => boolean;
  canUseAdvancedReports: () => boolean;
  hasPrioritySupport: () => boolean;
  upgradeToPremium: () => Promise<void>;
}

// Criação do contexto com valores padrão
const SubscriptionContext = createContext<SubscriptionContextType>({
  userPlan: 'free',
  isLoading: true,
  canCreateProject: () => false,
  canAddUserToProject: () => false,
  canUseAdvancedGantt: () => false,
  canUseIntegrations: () => false,
  canUseAdvancedReports: () => false,
  hasPrioritySupport: () => false,
  upgradeToPremium: async () => {},
});

// Hook personalizado para usar o contexto de assinatura
export const useSubscription = () => useContext(SubscriptionContext);

// Provedor de assinatura
export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userPlan, setUserPlan] = useState<PlanType>('free');
  const [isLoading, setIsLoading] = useState(true);

  // Carrega o plano do usuário quando o componente é montado
  useEffect(() => {
    const loadUserPlan = async () => {
      try {
        setIsLoading(true);
        
        // Verifica a sessão atual
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Busca os dados de assinatura do usuário
          const { data, error } = await supabase
            .from('profiles')
            .select('subscription_plan')
            .eq('id', session.user.id)
            .single();
            
          if (error) {
            console.error('Erro ao carregar plano do usuário:', error);
            setUserPlan('free'); // Fallback para plano gratuito
          } else if (data) {
            setUserPlan(data.subscription_plan as PlanType || 'free');
          }
        } else {
          setUserPlan('free'); // Usuário não autenticado usa plano gratuito
        }
      } catch (error) {
        console.error('Erro ao carregar dados de assinatura:', error);
        setUserPlan('free'); // Fallback para plano gratuito
      } finally {
        setIsLoading(false);
      }
    };

    loadUserPlan();
  }, []);

  // Funções para verificar capacidades com base no plano
  const canCreateProject = (currentProjectCount: number) => {
    const limit = PLAN_LIMITS[userPlan].maxProjects;
    return currentProjectCount < limit;
  };

  const canAddUserToProject = (currentUserCount: number) => {
    const limit = PLAN_LIMITS[userPlan].maxUsersPerProject;
    return currentUserCount < limit;
  };

  const canUseAdvancedGantt = () => {
    return PLAN_LIMITS[userPlan].hasAdvancedGantt;
  };

  const canUseIntegrations = () => {
    return PLAN_LIMITS[userPlan].hasIntegrations;
  };

  const canUseAdvancedReports = () => {
    return PLAN_LIMITS[userPlan].hasAdvancedReports;
  };

  const hasPrioritySupport = () => {
    return PLAN_LIMITS[userPlan].hasPrioritySupport;
  };

  // Função para fazer upgrade para o plano premium
  const upgradeToPremium = async () => {
    try {
      // Na implementação real, aqui seria integrado com um gateway de pagamento
      // Por enquanto, apenas atualizamos o status no banco de dados
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('Usuário não autenticado');
      }
      
      // Atualiza o plano no banco de dados
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_plan: 'premium' })
        .eq('id', session.user.id);
        
      if (error) {
        throw new Error('Erro ao atualizar plano');
      }
      
      // Atualiza o estado local
      setUserPlan('premium');
      
      // Na implementação real, você também atualizaria informações de pagamento
      
    } catch (error) {
      console.error('Erro ao fazer upgrade para o plano premium:', error);
      throw error;
    }
  };

  // Valores do contexto
  const value = {
    userPlan,
    isLoading,
    canCreateProject,
    canAddUserToProject,
    canUseAdvancedGantt,
    canUseIntegrations,
    canUseAdvancedReports,
    hasPrioritySupport,
    upgradeToPremium,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export default SubscriptionProvider; 