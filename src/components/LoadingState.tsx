import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Carregando...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
      <p className="text-lg text-center text-muted-foreground">{message}</p>
    </div>
  );
};

export default LoadingState;
