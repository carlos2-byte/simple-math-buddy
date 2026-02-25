import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { RotateCcw, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  FaixaINSS,
  FaixaIRRF,
  carregarTabelaINSS,
  salvarTabelaINSS,
  carregarTabelaIRRF,
  salvarTabelaIRRF,
  resetarTabelas,
  TABELA_INSS_PADRAO,
  TABELA_IRRF_PADRAO,
} from '@/lib/tabelas';

const Configuracoes = () => {
  const [tabelaINSS, setTabelaINSS] = useState<FaixaINSS[]>([]);
  const [tabelaIRRF, setTabelaIRRF] = useState<FaixaIRRF[]>([]);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    setTabelaINSS(carregarTabelaINSS());
    setTabelaIRRF(carregarTabelaIRRF());
  }, []);

  const handleSalvar = () => {
    salvarTabelaINSS(tabelaINSS);
    salvarTabelaIRRF(tabelaIRRF);
    toast.success('Tabelas salvas com sucesso!');
  };

  const handleResetar = () => {
    resetarTabelas();
    setTabelaINSS([...TABELA_INSS_PADRAO]);
    setTabelaIRRF([...TABELA_IRRF_PADRAO]);
    toast.success('Tabelas restauradas ao padrão!');
  };

  const handleApagarTudo = () => {
    if (confirmText !== 'APAGAR') return;
    const keys = Object.keys(localStorage);
    keys.forEach(key => localStorage.removeItem(key));
    sessionStorage.clear();
    setShowClearDialog(false);
    setConfirmText('');
    toast.success('✅ Todos os dados foram apagados');
    setTimeout(() => { window.location.reload(); }, 1500);
  };

  const updateINSS = (index: number, field: keyof FaixaINSS, value: string) => {
    const nova = [...tabelaINSS];
    nova[index] = { ...nova[index], [field]: parseFloat(value) || 0 };
    setTabelaINSS(nova);
  };

  const updateIRRF = (index: number, field: keyof FaixaIRRF, value: string) => {
    const nova = [...tabelaIRRF];
    if (field === 'ate' && index === nova.length - 1) return;
    nova[index] = { ...nova[index], [field]: parseFloat(value) || 0 };
    setTabelaIRRF(nova);
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <PageHeader title="Configurações" subtitle="Tabelas INSS e IRRF" />

      <div className="px-4 -mt-2 space-y-4">
        {/* INSS */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl card-shadow p-4 space-y-3"
        >
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Tabela INSS (Progressiva)
          </Label>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <p className="text-[10px] font-semibold text-muted-foreground">Até (R$)</p>
              <p className="text-[10px] font-semibold text-muted-foreground">Alíquota (%)</p>
            </div>
            {tabelaINSS.map((faixa, i) => (
              <div key={i} className="grid grid-cols-2 gap-2">
                <Input type="text" inputMode="decimal" value={faixa.ate} onChange={(e) => updateINSS(i, 'ate', e.target.value)} className="text-xs h-9" />
                <Input type="text" inputMode="decimal" value={faixa.aliquota} onChange={(e) => updateINSS(i, 'aliquota', e.target.value)} className="text-xs h-9" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* IRRF */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl card-shadow p-4 space-y-3"
        >
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Tabela IRRF (Progressiva)
          </Label>
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <p className="text-[10px] font-semibold text-muted-foreground">Até (R$)</p>
              <p className="text-[10px] font-semibold text-muted-foreground">Alíquota (%)</p>
              <p className="text-[10px] font-semibold text-muted-foreground">Dedução (R$)</p>
            </div>
            {tabelaIRRF.map((faixa, i) => (
              <div key={i} className="grid grid-cols-3 gap-2">
                <Input type="text" inputMode="decimal" value={i === tabelaIRRF.length - 1 ? '∞' : faixa.ate} disabled={i === tabelaIRRF.length - 1} onChange={(e) => updateIRRF(i, 'ate', e.target.value)} className="text-xs h-9" />
                <Input type="text" inputMode="decimal" value={faixa.aliquota} onChange={(e) => updateIRRF(i, 'aliquota', e.target.value)} className="text-xs h-9" />
                <Input type="text" inputMode="decimal" value={faixa.deducao} onChange={(e) => updateIRRF(i, 'deducao', e.target.value)} className="text-xs h-9" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <Button onClick={handleSalvar} className="w-full gradient-card text-primary-foreground font-bold py-5 rounded-xl card-shadow-lg">
            Salvar Configurações
          </Button>
          <Button onClick={handleResetar} variant="outline" className="w-full py-4 rounded-xl gap-2">
            <RotateCcw className="h-4 w-4" />
            Restaurar Padrão
          </Button>
        </motion.div>

        {/* Apagar Todos os Dados */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="pt-4"
        >
          <Dialog open={showClearDialog} onOpenChange={(open) => { setShowClearDialog(open); if (!open) setConfirmText(''); }}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="w-full py-4 rounded-xl gap-2">
                <Trash2 className="h-4 w-4" />
                🗑️ Apagar Todas as Informações
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-destructive flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  Apagar Todas as Informações
                </DialogTitle>
                <DialogDescription className="text-left">
                  Esta ação irá excluir permanentemente:
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 py-2">
                <p className="text-sm text-foreground">📋 Todos os cálculos do histórico</p>
                <p className="text-sm text-foreground">👤 Dados de login/perfil</p>
                <p className="text-sm text-foreground">⚙️ Configurações personalizadas</p>
                <p className="text-sm text-foreground">📊 Tabelas INSS/IRRF editadas</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-destructive">
                  Digite APAGAR para confirmar:
                </Label>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder="APAGAR"
                  className="border-destructive/50"
                />
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => { setShowClearDialog(false); setConfirmText(''); }}>
                  Cancelar
                </Button>
                <Button variant="destructive" disabled={confirmText !== 'APAGAR'} onClick={handleApagarTudo}>
                  Confirmar Exclusão
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>

        <p className="text-[10px] text-muted-foreground text-center px-4 pt-2">
          As tabelas são usadas nos cálculos de desconto INSS e IRRF.
        </p>
      </div>
    </div>
  );
};

export default Configuracoes;