import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, FileText, Clock, ChevronRight, Briefcase, Calendar, Gift, Shield, DollarSign, Settings } from 'lucide-react';
import FirstOpenModal, { hasSeenFirstOpen } from '@/components/FirstOpenModal';
import { getLocalUser } from '@/lib/userConfig';

const menuItems = [
  {
    title: 'Rescisão Completa',
    description: 'Calcule todos os valores de uma vez',
    icon: Calculator,
    path: '/rescisao',
    featured: true,
  },
  {
    title: 'Férias',
    description: 'Vencidas, proporcionais e em dobro',
    icon: Calendar,
    path: '/simulador/ferias',
  },
  {
    title: '13º Salário',
    description: 'Proporcional ao tempo trabalhado',
    icon: Gift,
    path: '/simulador/decimo',
  },
  {
    title: 'Aviso Prévio',
    description: 'Proporcional ao tempo de serviço',
    icon: Briefcase,
    path: '/simulador/aviso',
  },
  {
    title: 'FGTS + Multa',
    description: 'Estimativa de saldo e multa 40%',
    icon: Shield,
    path: '/simulador/fgts',
  },
];

const Index = () => {
  const navigate = useNavigate();
  const [showFirstOpen, setShowFirstOpen] = useState(!hasSeenFirstOpen());

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence>
        {showFirstOpen && (
          <FirstOpenModal onDone={() => setShowFirstOpen(false)} />
        )}
      </AnimatePresence>
      {/* Hero */}
      <div className="gradient-hero px-5 pt-12 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">Calculadora CLT</span>
          </div>
          <h1 className="text-2xl font-bold text-navy-foreground mb-1">
            Rescisão Trabalhista
          </h1>
          <p className="text-sm text-navy-foreground/70">
            Simule seus direitos com base na legislação vigente
          </p>
        </motion.div>
      </div>

      {/* Main Menu */}
      <div className="px-4 -mt-4 pb-6 space-y-3">
        {menuItems.map((item, index) => (
          <motion.button
            key={item.path}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.06 }}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all active:scale-[0.98] ${
              item.featured
                ? 'gradient-card text-primary-foreground card-shadow-lg'
                : 'bg-card text-card-foreground card-shadow'
            }`}
          >
            <div className={`flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center ${
              item.featured
                ? 'bg-primary-foreground/20'
                : 'bg-accent'
            }`}>
              <item.icon className={`h-5 w-5 ${
                item.featured ? 'text-primary-foreground' : 'text-primary'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{item.title}</p>
              <p className={`text-xs mt-0.5 ${
                item.featured ? 'text-primary-foreground/70' : 'text-muted-foreground'
              }`}>
                {item.description}
              </p>
            </div>
            <ChevronRight className={`h-4 w-4 flex-shrink-0 ${
              item.featured ? 'text-primary-foreground/50' : 'text-muted-foreground'
            }`} />
          </motion.button>
        ))}

        {/* History */}
        <motion.button
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
          onClick={() => navigate('/historico')}
          className="w-full flex items-center gap-4 p-4 rounded-xl bg-card text-card-foreground card-shadow text-left transition-all active:scale-[0.98]"
        >
          <div className="flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center bg-accent">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Histórico</p>
            <p className="text-xs text-muted-foreground mt-0.5">Consulte simulações anteriores</p>
          </div>
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        </motion.button>

        {/* Settings */}
        <motion.button
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          onClick={() => navigate('/configuracoes')}
          className="w-full flex items-center gap-4 p-4 rounded-xl bg-card text-card-foreground card-shadow text-left transition-all active:scale-[0.98]"
        >
          <div className="flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center bg-accent">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Configurações</p>
            <p className="text-xs text-muted-foreground mt-0.5">Tabelas INSS e IRRF</p>
          </div>
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        </motion.button>
      </div>

      {/* Footer disclaimer */}
      <div className="px-6 pb-8">
        <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
          Simulação baseada na legislação trabalhista brasileira vigente. Valores estimativos. Consulte um advogado para orientação específica.
        </p>
      </div>
    </div>
  );
};

export default Index;
