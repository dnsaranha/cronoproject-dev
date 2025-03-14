import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import LoadingState from "@/components/LoadingState";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    avatarUrl: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Buscar perfil do usuário
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (error) throw error;
          
          setUserData({ ...user, profile });
          setFormData({
            fullName: profile?.full_name || '',
            email: user.email || '',
            avatarUrl: profile?.avatar_url || ''
          });
        }
      } catch (error: any) {
        console.error('Erro ao carregar perfil:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados do perfil.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    }
    
    loadProfile();
  }, []);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          avatar_url: formData.avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userData.id);
        
      if (error) throw error;
      
      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram atualizadas com sucesso.'
      });
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o perfil.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Seu Perfil</CardTitle>
          <CardDescription>
            Atualize suas informações pessoais
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={formData.email}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                O email não pode ser alterado
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome completo</Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Seu nome completo"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="avatarUrl">URL da foto de perfil</Label>
              <Input
                id="avatarUrl"
                name="avatarUrl"
                value={formData.avatarUrl}
                onChange={handleChange}
                placeholder="https://exemplo.com/sua-foto.jpg"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 