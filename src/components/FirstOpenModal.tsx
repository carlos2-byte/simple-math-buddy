import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { User, Building2, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import {
  hasSeenFirstOpen,
  markFirstOpenDone,
  saveLocalUser,
  validarCNPJ,
  formatarCNPJ,
  type UserData,
} from '@/lib/userConfig';

// Re-export for backward compatibility
export { hasSeenFirstOpen };
export { getLocalUser } from '@/lib/userConfig';

interface FirstOpenModalProps {
  onDone: () => void;
}

const FirstOpenModal = ({ onDone }: FirstOpenModalProps) => {
  const [step, setStep] = useState<'profile' | 'worker_login' | 'rh_signup'>('profile');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [cnpj, setCnpj] = useState('');

  const handleSkipWorker = () => {
    saveLocalUser({ tipo: 'trabalhador' });
    onDone();
  };

  const handleWorkerSignup = () => {
    if (!nome.trim()) { toast.error('Informe seu nome'); return; }
    if (!email.trim() || !email.includes('@')) { toast.error('Informe um email válido'); return; }
    if (senha.length < 4) { toast.error('Senha deve ter ao menos 4 caracteres'); return; }

    saveLocalUser({ tipo: 'trabalhador', nome: nome.trim(), email: email.trim() });
    toast.success(`Bem-vindo(a), ${nome.trim()}!`);
    onDone();
  };

  const handleRHSignup = () => {
    if (!empresa.trim()) { toast.error('Informe o nome da empresa'); return; }
    if (!cnpj.trim() || !validarCNPJ(cnpj)) { toast.error('Informe um CNPJ válido'); return; }
    if (!email.trim() || !email.includes('@')) { toast.error('Informe um email corporativo válido'); return; }
    if (senha.length < 4) { toast.error('Senha deve ter ao menos 4 caracteres'); return; }

    saveLocalUser({
      tipo: 'rh',
      empresa: empresa.trim(),
      cnpj: cnpj.replace(/\D/g, ''),
      email: email.trim(),
      nome: empresa.trim(),
    });
    toast.success(`Bem-vindo(a), ${empresa.trim()}!`);
    onDone();
  };

  const handleCnpjChange = (value: string) => {
    setCnpj(formatarCNPJ(value));
  };

  const cardClass = "bg-card rounded-2xl card-shadow-lg p-6 w-full max-w-sm space-y-4";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 backdrop-blur-sm p-4"
    >
      <AnimatePresence mode="wait">
        {step === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cardClass + ' space-y-5'}
          >
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full gradient-card flex items-center justify-center mx-auto">
                <span className="text-2xl">💼</span>
              </div>
              <h2 className="text-lg font-bold text-card-foreground">CLT PRO Brasil</h2>
              <p className="text-sm text-muted-foreground">
                Bem-vindo! Quem é você?
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setStep('worker_login')}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-secondary text-secondary-foreground transition-all active:scale-[0.98] text-left"
              >
                <div className="w-11 h-11 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Sou Trabalhador</p>
                  <p className="text-xs text-muted-foreground">Uso pessoal</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </button>

              <button
                onClick={() => setStep('rh_signup')}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-secondary text-secondary-foreground transition-all active:scale-[0.98] text-left"
              >
                <div className="w-11 h-11 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Sou RH / Empresa</p>
                  <p className="text-xs text-muted-foreground">Cadastro obrigatório</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 'worker_login' && (
          <motion.div
            key="worker"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={cardClass}
          >
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-card-foreground">👤 Trabalhador</h2>
              <p className="text-xs text-muted-foreground">Cadastro opcional - seus dados ficam no dispositivo</p>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="fo-nome" className="text-xs font-medium text-muted-foreground">Nome</Label>
                <Input id="fo-nome" placeholder="Seu nome" value={nome} onChange={e => setNome(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="fo-email" className="text-xs font-medium text-muted-foreground">Email</Label>
                <Input id="fo-email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="fo-senha" className="text-xs font-medium text-muted-foreground">Senha</Label>
                <Input id="fo-senha" type="password" placeholder="••••••" value={senha} onChange={e => setSenha(e.target.value)} className="mt-1" />
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <Button
                onClick={handleWorkerSignup}
                className="w-full gradient-card text-primary-foreground font-semibold py-5 rounded-xl"
              >
                Criar conta
              </Button>
              <Button
                onClick={handleSkipWorker}
                variant="ghost"
                className="w-full text-muted-foreground font-medium py-5 rounded-xl"
              >
                Continuar sem login
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button
                onClick={() => setStep('profile')}
                variant="ghost"
                className="w-full text-muted-foreground text-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'rh_signup' && (
          <motion.div
            key="rh"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={cardClass}
          >
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-card-foreground">🏢 RH / Empresa</h2>
              <p className="text-xs text-muted-foreground">Cadastro obrigatório para modo empresarial</p>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="fo-empresa" className="text-xs font-medium text-muted-foreground">Nome da Empresa *</Label>
                <Input id="fo-empresa" placeholder="Empresa LTDA" value={empresa} onChange={e => setEmpresa(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="fo-cnpj" className="text-xs font-medium text-muted-foreground">CNPJ *</Label>
                <Input id="fo-cnpj" placeholder="00.000.000/0000-00" value={cnpj} onChange={e => handleCnpjChange(e.target.value)} className="mt-1" inputMode="numeric" />
              </div>
              <div>
                <Label htmlFor="fo-email-rh" className="text-xs font-medium text-muted-foreground">Email Corporativo *</Label>
                <Input id="fo-email-rh" type="email" placeholder="rh@empresa.com" value={email} onChange={e => setEmail(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="fo-senha-rh" className="text-xs font-medium text-muted-foreground">Senha *</Label>
                <Input id="fo-senha-rh" type="password" placeholder="••••••" value={senha} onChange={e => setSenha(e.target.value)} className="mt-1" />
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <Button
                onClick={handleRHSignup}
                className="w-full gradient-card text-primary-foreground font-semibold py-5 rounded-xl"
              >
                Cadastrar Empresa
              </Button>
              <Button
                onClick={() => setStep('profile')}
                variant="ghost"
                className="w-full text-muted-foreground text-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FirstOpenModal;
