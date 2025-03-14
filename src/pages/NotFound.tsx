
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-md">
        <h1 className="text-6xl font-bold mb-4 text-primary">404</h1>
        <p className="text-xl text-gray-700 mb-6">Oops! Página não encontrada</p>
        <p className="text-gray-500 mb-8">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Button 
          onClick={() => navigate("/")}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          Voltar para o Gantt
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
