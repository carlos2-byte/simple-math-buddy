import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}

const PageHeader = ({ title, subtitle, onBack }: PageHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="gradient-hero px-5 pt-8 pb-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={onBack ?? (() => navigate(-1))}
          className="flex items-center gap-1 text-sm text-navy-foreground/70 mb-3 active:opacity-70"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <h1 className="text-xl font-bold text-navy-foreground">{title}</h1>
        {subtitle && (
          <p className="text-xs text-navy-foreground/60 mt-1">{subtitle}</p>
        )}
      </motion.div>
    </div>
  );
};

export default PageHeader;
