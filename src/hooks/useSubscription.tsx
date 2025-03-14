import { useSubscription as useSubscriptionContext } from '@/providers/SubscriptionProvider';
import { PlanType, PLAN_LIMITS } from '@/providers/SubscriptionProvider';

/**
 * Hook para acessar informações do plano de assinatura do usuário
 * e verificar permissões baseadas no plano atual.
 * 
 * @returns Objeto com informações do plano e métodos de verificação
 */
export const useSubscription = () => {
  const subscription = useSubscriptionContext();
  
  return {
    ...subscription,
    
    // Métodos adicionais específicos para componentes
    isPremium: () => subscription.userPlan === 'premium',
    isFree: () => subscription.userPlan === 'free',
    
    // Retorna os limites específicos do plano atual
    getPlanLimits: () => PLAN_LIMITS[subscription.userPlan],
    
    // Verifica se o usuário pode usar recursos específicos
    canUseFeature: (feature: keyof typeof PLAN_LIMITS.premium) => {
      if (typeof PLAN_LIMITS[subscription.userPlan][feature] === 'boolean') {
        return PLAN_LIMITS[subscription.userPlan][feature] as boolean;
      }
      return false;
    },
    
    // Verifica quanto o usuário já utilizou de um limite
    getRemainingProjects: (currentProjectCount: number) => {
      const limit = PLAN_LIMITS[subscription.userPlan].maxProjects;
      if (limit === Infinity) return 'Ilimitado';
      return Math.max(0, limit - currentProjectCount);
    },
    
    getRemainingUsersForProject: (currentUserCount: number) => {
      const limit = PLAN_LIMITS[subscription.userPlan].maxUsersPerProject;
      if (limit === Infinity) return 'Ilimitado';
      return Math.max(0, limit - currentUserCount);
    },
    
    // Exibe uma mensagem amigável sobre o limite
    getProjectLimitMessage: (currentProjectCount: number) => {
      const limit = PLAN_LIMITS[subscription.userPlan].maxProjects;
      if (limit === Infinity) return 'Você pode criar projetos ilimitados';
      
      const remaining = Math.max(0, limit - currentProjectCount);
      if (remaining === 0) {
        return 'Você atingiu o limite de projetos do plano Free. Faça upgrade para o plano Premium para criar mais projetos.';
      }
      return `Você pode criar mais ${remaining} projeto${remaining !== 1 ? 's' : ''} no seu plano atual.`;
    },
    
    getUserLimitMessage: (currentUserCount: number) => {
      const limit = PLAN_LIMITS[subscription.userPlan].maxUsersPerProject;
      if (limit === Infinity) return 'Você pode adicionar usuários ilimitados';
      
      const remaining = Math.max(0, limit - currentUserCount);
      if (remaining === 0) {
        return 'Você atingiu o limite de usuários por projeto do plano Free. Faça upgrade para o plano Premium para adicionar mais usuários.';
      }
      return `Você pode adicionar mais ${remaining} usuário${remaining !== 1 ? 's' : ''} neste projeto.`;
    }
  };
};

export default useSubscription; 