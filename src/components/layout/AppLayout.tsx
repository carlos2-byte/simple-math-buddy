import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="relative min-h-screen min-h-dvh w-full bg-background overflow-x-hidden">
      {/* 1. Conteúdo principal do app */}
      <div className="pb-4">
        {children}
      </div>

      {/* 2. Menu de navegação */}
      <BottomNav />

      {/* 3. Espaço reservado para o banner do AdMob (65px) ABAIXO da navegação */}
      <div 
        className="fixed left-0 right-0 z-40 bg-transparent pointer-events-none"
        style={{ 
          bottom: '0px',
          height: '65px' 
        }}
        aria-hidden="true"
      />
    </div>
  );
}
