
// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { email, projectId, projectName, inviterName, role } = await req.json();
    
    if (!email || !projectId) {
      throw new Error("Email e ID do projeto são obrigatórios");
    }
    
    const appUrl = Deno.env.get("APP_URL") || "https://cronoprojects.com";
    
    // Prepare the email
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Crono Project <no-reply@cronoprojects.com>",
        to: [email],
        subject: `Convite para colaborar no projeto ${projectName || 'Novo Projeto'}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4F46E5; margin-top: 32px;">Você foi convidado para um projeto!</h1>
            <p style="margin-top: 24px; font-size: 16px; color: #4B5563;">
              Olá,<br><br>
              ${inviterName || 'Um usuário'} está convidando você para colaborar no projeto "${projectName || 'Novo Projeto'}" como ${
                role === 'admin' ? 'Administrador' : 
                role === 'editor' ? 'Editor' : 'Visualizador'
              }.
            </p>
            
            <div style="margin: 32px 0;">
              <a href="${appUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Acessar o Crono Project
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6B7280;">
              Se você não tem uma conta, você precisará se cadastrar com este email (${email}) para acessar o projeto.
            </p>
            
            <hr style="margin: 32px 0; border: none; border-top: 1px solid #E5E7EB;" />
            
            <p style="font-size: 14px; color: #9CA3AF; text-align: center;">
              &copy; ${new Date().getFullYear()} Crono Project. Todos os direitos reservados.
            </p>
          </div>
        `,
      }),
    });

    const emailResult = await emailResponse.json();
    
    if (!emailResponse.ok) {
      throw new Error(`Erro ao enviar email: ${JSON.stringify(emailResult)}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Convite enviado com sucesso" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("Error in send-invitation function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Erro ao processar solicitação" 
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});
