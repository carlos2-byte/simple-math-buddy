import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AumentoSalarial, TipoAumento, formatarMoeda } from '@/lib/calculadora';
import { Plus, Trash2, Pencil, Check, X, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface HistoricoAumentosProps {
  aumentos: AumentoSalarial[];
  onChange: (aumentos: AumentoSalarial[]) => void;
  dataAdmissao: string; // yyyy-mm-dd
  dataDemissao: string;
}

const HistoricoAumentos = ({ aumentos, onChange, dataAdmissao, dataDemissao }: HistoricoAumentosProps) => {
  const [adicionando, setAdicionando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [novaData, setNovaData] = useState('');
  const [novoTipo, setNovoTipo] = useState<TipoAumento>('percentual');
  const [novoValor, setNovoValor] = useState('');

  const validar = (data: string, valor: string, idIgnorar?: string): boolean => {
    if (!data) { toast.error('Informe a data do aumento'); return false; }
    if (!valor || parseFloat(valor.replace(',', '.')) <= 0) {
      toast.error('Informe um valor válido maior que zero');
      return false;
    }
    if (dataAdmissao && new Date(data) < new Date(dataAdmissao)) {
      toast.error('Aumento não pode ser antes da admissão');
      return false;
    }
    if (dataDemissao && new Date(data) > new Date(dataDemissao)) {
      toast.error('Aumento não pode ser após a demissão');
      return false;
    }
    const duplicado = aumentos.some(a =>
      a.id !== idIgnorar &&
      new Date(a.data).toISOString().split('T')[0] === data
    );
    if (duplicado) { toast.error('Já existe um aumento nessa data'); return false; }
    return true;
  };

  const adicionar = () => {
    if (!validar(novaData, novoValor)) return;
    const novo: AumentoSalarial = {
      id: Date.now().toString(),
      data: new Date(novaData),
      tipo: novoTipo,
      valor: parseFloat(novoValor.replace(',', '.')),
    };
    const lista = [...aumentos, novo].sort((a, b) =>
      new Date(a.data).getTime() - new Date(b.data).getTime()
    );
    onChange(lista);
    setAdicionando(false);
    setNovaData('');
    setNovoValor('');
    toast.success('Aumento adicionado');
  };

  const salvarEdicao = (id: string) => {
    if (!validar(novaData, novoValor, id)) return;
    const lista = aumentos.map(a =>
      a.id === id
        ? { ...a, data: new Date(novaData), tipo: novoTipo, valor: parseFloat(novoValor.replace(',', '.')) }
        : a
    ).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    onChange(lista);
    setEditandoId(null);
    toast.success('Aumento atualizado');
  };

  const remover = (id: string) => {
    onChange(aumentos.filter(a => a.id !== id));
    toast.success('Aumento removido');
  };

  const iniciarEdicao = (a: AumentoSalarial) => {
    setEditandoId(a.id);
    setNovaData(new Date(a.data).toISOString().split('T')[0]);
    setNovoTipo(a.tipo);
    setNovoValor(a.valor.toString());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      className="bg-card rounded-xl card-shadow p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Histórico de Aumentos (Opcional)
          </Label>
        </div>
        {!adicionando && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => { setAdicionando(true); setNovaData(''); setNovoValor(''); setNovoTipo('percentual'); }}
          >
            <Plus className="h-3 w-3" /> Adicionar
          </Button>
        )}
      </div>

      {/* Lista de aumentos */}
      <AnimatePresence>
        {aumentos.map((a) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border border-border rounded-lg p-3 space-y-2"
          >
            {editandoId === a.id ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Data</Label>
                    <Input type="date" value={novaData} onChange={e => setNovaData(e.target.value)} className="mt-0.5 h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Tipo</Label>
                    <div className="flex gap-1 mt-0.5">
                      <button
                        type="button"
                        onClick={() => setNovoTipo('percentual')}
                        className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-all ${novoTipo === 'percentual' ? 'gradient-card text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                      >%</button>
                      <button
                        type="button"
                        onClick={() => setNovoTipo('valor_fixo')}
                        className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-all ${novoTipo === 'valor_fixo' ? 'gradient-card text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                      >R$</button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label className="text-[10px] text-muted-foreground">
                      {novoTipo === 'percentual' ? 'Percentual (%)' : 'Valor (R$)'}
                    </Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={novoValor}
                      onChange={e => setNovoValor(e.target.value)}
                      placeholder={novoTipo === 'percentual' ? '5' : '200,00'}
                      className="mt-0.5 h-8 text-xs"
                    />
                  </div>
                  <Button type="button" size="icon" className="h-8 w-8" onClick={() => salvarEdicao(a.id)}>
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditandoId(null)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <div className="text-xs space-y-0.5">
                  <p className="font-medium text-foreground">
                    {new Date(a.data).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-muted-foreground">
                    {a.tipo === 'percentual' ? `+${a.valor}%` : `+${formatarMoeda(a.valor)}`}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => iniciarEdicao(a)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remover(a.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Formulário para adicionar */}
      <AnimatePresence>
        {adicionando && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border border-primary/30 rounded-lg p-3 space-y-2 bg-accent/30"
          >
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">Data do aumento</Label>
                <Input type="date" value={novaData} onChange={e => setNovaData(e.target.value)} className="mt-0.5 h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Tipo</Label>
                <div className="flex gap-1 mt-0.5">
                  <button
                    type="button"
                    onClick={() => setNovoTipo('percentual')}
                    className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-all ${novoTipo === 'percentual' ? 'gradient-card text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                  >%</button>
                  <button
                    type="button"
                    onClick={() => setNovoTipo('valor_fixo')}
                    className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-all ${novoTipo === 'valor_fixo' ? 'gradient-card text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                  >R$</button>
                </div>
              </div>
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label className="text-[10px] text-muted-foreground">
                  {novoTipo === 'percentual' ? 'Percentual (%)' : 'Valor (R$)'}
                </Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={novoValor}
                  onChange={e => setNovoValor(e.target.value)}
                  placeholder={novoTipo === 'percentual' ? '5' : '200,00'}
                  className="mt-0.5 h-8 text-xs"
                />
              </div>
              <Button type="button" size="sm" className="h-8 text-xs gap-1" onClick={adicionar}>
                <Check className="h-3 w-3" /> Salvar
              </Button>
              <Button type="button" size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setAdicionando(false)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {aumentos.length === 0 && !adicionando && (
        <p className="text-[10px] text-muted-foreground text-center py-1">
          Nenhum aumento registrado. O salário informado será usado para todo o período.
        </p>
      )}
    </motion.div>
  );
};

export default HistoricoAumentos;
