
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

export function UserProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (error) throw error;
          
          setProfile(data);
          setFullName(data.full_name || '');
          setAvatarUrl(data.avatar_url);
        }
      } catch (error: any) {
        console.error('Erro ao carregar perfil:', error.message);
      }
    }
    
    loadProfile();
  }, []);

  async function handleUpdateProfile() {
    try {
      setLoading(true);
      
      if (!profile) return;
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);
        
      if (error) throw error;
      
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao desconectar",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  if (!profile) {
    return <div className="text-center p-4">Carregando perfil...</div>;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Seu Perfil</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            value={profile.email} 
            disabled 
            className="h-11 text-base sm:text-sm"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="fullName">Nome Completo</Label>
          <Input 
            id="fullName" 
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Seu nome completo"
            className="h-11 text-base sm:text-sm"
          />
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col sm:flex-row sm:justify-between space-y-3 sm:space-y-0">
        <Button
          variant="outline"
          onClick={handleSignOut}
          className="w-full sm:w-auto"
        >
          Sair
        </Button>
        
        <Button 
          onClick={handleUpdateProfile}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </CardFooter>
    </Card>
  );
}
