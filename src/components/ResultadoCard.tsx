import { motion } from 'framer-motion';
import { ResultadoRescisao, formatarMoeda, TipoRescisao } from '@/lib/calculadora';

interface ResultadoCardProps {
  resultado: ResultadoRescisao;
  tipoRescisao: TipoRescisao;
  inssValor: number;
  irrfValor: number;
  irrfFaixa: string;
  inssBase: number;
  irrfBase: number;
  totalBruto: number;
  totalDescontos: number;
  totalLiquido: number;
  seguroDesemprego?: { valorParcela: number; parcelas: number; total: number } | null;
}

interface LinhaResultado {
  label: string;
  valor: number;
  destaque?: boolean;
  info?: string;
  tipo?: 'normal' | 'desconto' | 'liquido' | 'seguro';
}

const ResultadoCard = ({
  resultado,
  tipoRescisao,
  inssValor,
  irrfValor,
  irrfFaixa,
  inssBase,
  irrfBase,
  totalBruto,
  totalDescontos,
  totalLiquido,
  seguroDesemprego,
}: ResultadoCardProps) => {
  const linhasVerbas: LinhaResultado[] = [];

  linhasVerbas.push({ label: 'Saldo de Salário', valor: resultado.saldoSalario, info: `${resultado.diasTrabalhadosMesDemissao} dias` });

  if (resultado.feriasVencidas > 0) {
    linhasVerbas.push({ label: 'Férias Vencidas', valor: resultado.feriasVencidas, info: `${resultado.periodosVencidos} período(s)` });
  }
  if (resultado.feriasDobro > 0) {
    linhasVerbas.push({ label: 'Férias em Dobro', valor: resultado.feriasDobro, info: `${resultado.periodosEmDobro} período(s)` });
  }
  if (resultado.feriasProporcionais > 0) {
    linhasVerbas.push({ label: 'Férias Proporcionais', valor: resultado.feriasProporcionais, info: `${resultado.mesesRestantes} meses` });
  }
  if (resultado.decimoTerceiro > 0) {
    linhasVerbas.push({ label: '13º Proporcional', valor: resultado.decimoTerceiro });
  }
  if (resultado.avisoPrevio > 0) {
    linhasVerbas.push({ label: 'Aviso Prévio', valor: resultado.avisoPrevio, info: `${resultado.avisoPrevioDias} dias` });
  }
  if (resultado.multaFGTS > 0) {
    linhasVerbas.push({ label: 'Multa 40% FGTS', valor: resultado.multaFGTS });
  }

  const renderLinha = (linha: LinhaResultado, i: number, isDesconto = false) => (
    <motion.div
      key={linha.label}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: i * 0.04 }}
      className="flex items-center justify-between px-4 py-3"
    >
      <div>
        <p className="text-sm font-medium text-card-foreground">{linha.label}</p>
        {linha.info && (
          <p className="text-[10px] mt-0.5 text-muted-foreground">{linha.info}</p>
        )}
      </div>
      <p className={`text-sm font-bold tabular-nums ${isDesconto ? 'text-destructive' : 'text-card-foreground'}`}>
        {isDesconto ? `- ${formatarMoeda(linha.valor)}` : formatarMoeda(linha.valor)}
      </p>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-3"
    >
      {/* Verbas */}
      <div className="bg-card rounded-xl card-shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Verbas Rescisórias</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {resultado.mesesTotais} meses ({resultado.anosCompletos}a {resultado.mesesRestantes}m)
          </p>
        </div>
        <div className="divide-y divide-border">
          {linhasVerbas.map((linha, i) => renderLinha(linha, i))}
          {/* Total Bruto */}
          <div className="flex items-center justify-between px-4 py-3 bg-secondary/50">
            <p className="text-sm font-bold text-card-foreground">TOTAL BRUTO</p>
            <p className="text-sm font-bold tabular-nums text-card-foreground">{formatarMoeda(totalBruto)}</p>
          </div>
        </div>
      </div>

      {/* Descontos */}
      <div className="bg-card rounded-xl card-shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Descontos</p>
        </div>
        <div className="divide-y divide-border">
          {renderLinha({ label: 'INSS', valor: inssValor, info: `Base: ${formatarMoeda(inssBase)}` }, 0, true)}
          {renderLinha({ label: 'IRRF', valor: irrfValor, info: `Base: ${formatarMoeda(irrfBase)} • Faixa: ${irrfFaixa}` }, 1, true)}
          <div className="flex items-center justify-between px-4 py-3 bg-destructive/10">
            <p className="text-sm font-bold text-destructive">TOTAL DESCONTOS</p>
            <p className="text-sm font-bold tabular-nums text-destructive">- {formatarMoeda(totalDescontos)}</p>
          </div>
        </div>
      </div>

      {/* Total Líquido */}
      <div className="bg-card rounded-xl card-shadow overflow-hidden">
        <div className="flex items-center justify-between px-4 py-4 gradient-success">
          <p className="text-base font-bold text-success-foreground">TOTAL LÍQUIDO</p>
          <p className="text-lg font-bold tabular-nums text-success-foreground">{formatarMoeda(totalLiquido)}</p>
        </div>
      </div>

      {/* FGTS info */}
      {tipoRescisao !== 'justa_causa' && (
        <div className="bg-accent/50 rounded-xl p-3">
          <p className="text-[10px] text-accent-foreground">
            💰 FGTS estimado: {formatarMoeda(resultado.fgtsTotal)} (depositado na conta vinculada, não incluso no total)
          </p>
        </div>
      )}

      {/* Seguro-Desemprego */}
      {seguroDesemprego && tipoRescisao === 'sem_justa_causa' && (
        <div className="bg-card rounded-xl card-shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">📋 Seguro-Desemprego</p>
          </div>
          <div className="divide-y divide-border">
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-sm font-medium text-card-foreground">Valor por parcela</p>
              <p className="text-sm font-bold tabular-nums text-card-foreground">{formatarMoeda(seguroDesemprego.valorParcela)}</p>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-sm font-medium text-card-foreground">Parcelas</p>
              <p className="text-sm font-bold tabular-nums text-card-foreground">{seguroDesemprego.parcelas}x</p>
            </div>
            <div className="flex items-center justify-between px-4 py-3 bg-accent/30">
              <p className="text-sm font-bold text-accent-foreground">Total estimado</p>
              <p className="text-sm font-bold tabular-nums text-accent-foreground">{formatarMoeda(seguroDesemprego.total)}</p>
            </div>
          </div>
        </div>
      )}

      {!seguroDesemprego && tipoRescisao === 'sem_justa_causa' && (
        <div className="bg-warning/10 rounded-xl p-3">
          <p className="text-[10px] text-foreground">
            ⚠️ Tempo de trabalho insuficiente para seguro-desemprego (mínimo 6 meses).
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default ResultadoCard;
