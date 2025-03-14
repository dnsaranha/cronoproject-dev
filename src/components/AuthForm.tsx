
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleSignUp() {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;
      
      toast({
        title: "Conta criada com sucesso!",
        description: "Você será redirecionado para a página principal.",
      });
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSignIn() {
    try {
      setLoading(true);
      
      console.log("Attempting to sign in with:", { email, password });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      console.log("Sign in successful:", data);
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Erro ao fazer login",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto border shadow-sm">
      <Tabs defaultValue="login">
        <CardHeader className="space-y-1 p-4 sm:p-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Cadastro</TabsTrigger>
          </TabsList>
          <CardDescription className="pt-3 text-xs sm:text-sm">
            Acesse ou crie sua conta para gerenciar seus projetos
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-4 sm:p-6">
          <TabsContent value="login" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com" 
                className="h-11 text-base sm:text-sm"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 text-base sm:text-sm"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="register" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input 
                id="fullName" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu Nome Completo"
                className="h-11 text-base sm:text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailRegister">Email</Label>
              <Input 
                id="emailRegister" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="h-11 text-base sm:text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordRegister">Senha</Label>
              <Input 
                id="passwordRegister" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 text-base sm:text-sm"
              />
            </div>
          </TabsContent>
        </CardContent>
        
        <CardFooter className="p-4 sm:p-6">
          <TabsContent value="login" className="w-full">
            <Button 
              className="w-full h-11 text-base sm:text-sm" 
              onClick={handleSignIn}
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </TabsContent>
          
          <TabsContent value="register" className="w-full">
            <Button 
              className="w-full h-11 text-base sm:text-sm" 
              onClick={handleSignUp}
              disabled={loading}
            >
              {loading ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </TabsContent>
        </CardFooter>
      </Tabs>
    </Card>
  );
}
