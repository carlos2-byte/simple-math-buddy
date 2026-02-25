import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/PageHeader';
import { carregarHistorico, limparHistorico, formatarMoeda, labelTipoRescisao, HistoricoItem } from '@/lib/calculadora';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Historico = () => {
  const [items, setItems] = useState<HistoricoItem[]>([]);

  useEffect(() => {
    setItems(carregarHistorico());
  }, []);

  const handleLimpar = () => {
    limparHistorico();
    setItems([]);
    toast.success('Histórico limpo');
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <PageHeader title="Histórico" subtitle="Suas simulações anteriores" />

      <div className="px-4 -mt-2 space-y-3">
        {items.length > 0 && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLimpar}
              className="text-destructive text-xs gap-1"
            >
              <Trash2 className="h-3 w-3" />
              Limpar tudo
            </Button>
          </div>
        )}

        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <p className="text-muted-foreground text-sm">Nenhuma simulação salva</p>
            <p className="text-muted-foreground text-xs mt-1">Faça um cálculo para ver aqui</p>
          </motion.div>
        ) : (
          items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-xl card-shadow p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    {labelTipoRescisao(item.dados.tipoRescisao)}
                  </span>
                  {item.dados.nomeFuncionario && (
                    <p className="text-xs font-medium text-primary mt-0.5">
                      Funcionário: {item.dados.nomeFuncionario}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(item.data).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Salário: {formatarMoeda(item.dados.salario)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.dados.dataAdmissao).toLocaleDateString('pt-BR')} → {new Date(item.dados.dataDemissao).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <p className="text-lg font-bold text-primary tabular-nums">
                  {formatarMoeda(item.resultado.totalGeral)}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default Historico;
