import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatarMoeda } from '@/lib/calculadora';
import { isModoRH } from '@/lib/userConfig';
import { toast } from 'sonner';
import { User } from 'lucide-react';

interface SimResult {
  label: string;
  valor: number;
  info?: string;
}

const simuladorConfig: Record<string, { title: string; subtitle: string }> = {
  ferias: { title: 'Simulador de Férias', subtitle: 'Calcule férias vencidas, proporcionais e em dobro' },
  decimo: { title: '13º Salário', subtitle: 'Calcule o 13º proporcional' },
  aviso: { title: 'Aviso Prévio', subtitle: 'Calcule o aviso prévio proporcional' },
  fgts: { title: 'FGTS + Multa', subtitle: 'Estime o saldo e multa de 40%' },
};

const Simulador = () => {
  const { tipo } = useParams<{ tipo: string }>();
  const navigate = useNavigate();
  const config = simuladorConfig[tipo || ''];
  const isRH = isModoRH();

  const [salario, setSalario] = useState('');
  const [dataAdmissao, setDataAdmissao] = useState('');
  const [dataDemissao, setDataDemissao] = useState('');
  const [saldoFGTS, setSaldoFGTS] = useState('');
  const [nomeFuncionario, setNomeFuncionario] = useState('');
  const [resultados, setResultados] = useState<SimResult[] | null>(null);

  if (!config) {
    navigate('/');
    return null;
  }

  const parseSalario = () => {
    const sal = parseFloat(salario.replace(/\./g, '').replace(',', '.'));
    if (!sal || sal <= 0) { toast.error('Informe um salário válido'); return null; }
    return sal;
  };

  const parseDatas = () => {
    if (!dataAdmissao || !dataDemissao) { toast.error('Informe as datas'); return null; }
    const a = new Date(dataAdmissao);
    const d = new Date(dataDemissao);
    if (d <= a) { toast.error('Data de demissão deve ser posterior'); return null; }
    return { admissao: a, demissao: d };
  };

  const diffMeses = (a: Date, b: Date) => {
    const anos = b.getFullYear() - a.getFullYear();
    const meses = b.getMonth() - a.getMonth();
    const dias = b.getDate() - a.getDate();
    let total = anos * 12 + meses;
    if (dias >= 15) total += 1;
    else if (dias < 0) {
      const last = new Date(b.getFullYear(), b.getMonth(), 0).getDate();
      if (last + dias < 15) total -= 1;
    }
    return Math.max(0, total);
  };

  const round = (v: number) => Math.round(v * 100) / 100;

  const handleCalcular = () => {
    if (isRH && !nomeFuncionario.trim()) {
      toast.error('Informe o nome ou registro do funcionário');
      return;
    }

    const sal = parseSalario();
    if (!sal) return;
    const datas = parseDatas();
    if (!datas) return;

    const { admissao, demissao } = datas;
    const meses = diffMeses(admissao, demissao);
    const anosCompletos = Math.floor(meses / 12);
    const mesesRest = meses % 12;
    const res: SimResult[] = [];

    if (tipo === 'ferias') {
      const valorPeriodo = sal + sal / 3;
      let vencidos = 0;
      let dobro = 0;
      for (let i = 0; i < anosCompletos; i++) {
        const fim = new Date(admissao);
        fim.setFullYear(fim.getFullYear() + i + 1);
        const limite = new Date(fim);
        limite.setFullYear(limite.getFullYear() + 1);
        if (demissao > limite) dobro++;
        else vencidos++;
      }
      if (vencidos > 0) res.push({ label: 'Férias Vencidas', valor: round(vencidos * valorPeriodo), info: `${vencidos} período(s)` });
      if (dobro > 0) res.push({ label: 'Férias em Dobro', valor: round(dobro * valorPeriodo * 2), info: `${dobro} período(s)` });
      if (mesesRest > 0) {
        const base = (sal / 12) * mesesRest;
        res.push({ label: 'Férias Proporcionais', valor: round(base + base / 3), info: `${mesesRest} meses` });
      }
      const total = res.reduce((s, r) => s + r.valor, 0);
      res.push({ label: 'Total Férias', valor: round(total) });
    } else if (tipo === 'decimo') {
      const inicioAno = new Date(demissao.getFullYear(), 0, 1);
      const dataRef = admissao > inicioAno ? admissao : inicioAno;
      const meses13 = diffMeses(dataRef, demissao);
      const valor = round((sal / 12) * Math.min(meses13, 12));
      res.push({ label: '13º Proporcional', valor, info: `${Math.min(meses13, 12)} meses` });
    } else if (tipo === 'aviso') {
      const dias = Math.min(30 + 3 * anosCompletos, 90);
      const valor = round((sal / 30) * dias);
      res.push({ label: 'Aviso Prévio', valor, info: `${dias} dias` });
    } else if (tipo === 'fgts') {
      const fgtsMensal = sal * 0.08;
      const fgtsManual = saldoFGTS ? parseFloat(saldoFGTS.replace(/\./g, '').replace(',', '.')) : undefined;
      const total = round(fgtsManual ?? fgtsMensal * meses);
      const multa = round(total * 0.4);
      res.push({ label: 'FGTS Estimado', valor: total, info: `${meses} meses` });
      res.push({ label: 'Multa 40%', valor: multa });
      res.push({ label: 'Total (FGTS + Multa)', valor: round(total + multa) });
    }

    setResultados(res);
    toast.success('Calculado!');
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <PageHeader title={config.title} subtitle={config.subtitle} />

      <div className="px-4 -mt-2 space-y-4">
        {/* Identificação do Funcionário - Modo RH */}
        {isRH && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl card-shadow p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-primary" />
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Identificação do Funcionário *
              </Label>
            </div>
            <Input
              placeholder="Nome completo ou Nº Registro"
              value={nomeFuncionario}
              onChange={(e) => setNomeFuncionario(e.target.value)}
            />
            <p className="text-[9px] text-muted-foreground mt-1">Campo obrigatório para modo RH</p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl card-shadow p-4 space-y-4"
        >
          <div>
            <Label className="text-xs font-medium text-muted-foreground">Salário Bruto (R$)</Label>
            <Input type="text" inputMode="decimal" placeholder="3.500,00" value={salario} onChange={(e) => setSalario(e.target.value)} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Data Admissão</Label>
              <Input type="date" value={dataAdmissao} onChange={(e) => setDataAdmissao(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Data Demissão</Label>
              <Input type="date" value={dataDemissao} onChange={(e) => setDataDemissao(e.target.value)} className="mt-1" />
            </div>
          </div>
          {tipo === 'fgts' && (
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Saldo FGTS (opcional)</Label>
              <Input type="text" inputMode="decimal" placeholder="Deixe vazio para estimar" value={saldoFGTS} onChange={(e) => setSaldoFGTS(e.target.value)} className="mt-1" />
            </div>
          )}
        </motion.div>

        <Button onClick={handleCalcular} className="w-full gradient-card text-primary-foreground font-bold py-6 text-base rounded-xl card-shadow-lg">
          Calcular
        </Button>

        {resultados && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl card-shadow overflow-hidden"
          >
            <div className="divide-y divide-border">
              {resultados.map((r, i) => {
                const isLast = i === resultados.length - 1;
                return (
                  <div key={r.label} className={`flex items-center justify-between px-4 py-3 ${isLast ? 'gradient-success' : ''}`}>
                    <div>
                      <p className={`text-sm font-medium ${isLast ? 'text-success-foreground font-bold' : 'text-card-foreground'}`}>{r.label}</p>
                      {r.info && <p className={`text-[10px] mt-0.5 ${isLast ? 'text-success-foreground/70' : 'text-muted-foreground'}`}>{r.info}</p>}
                    </div>
                    <p className={`text-sm font-bold tabular-nums ${isLast ? 'text-success-foreground text-base' : 'text-card-foreground'}`}>{formatarMoeda(r.valor)}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        <p className="text-[10px] text-muted-foreground text-center px-4 pt-2">
          Simulação baseada na legislação trabalhista brasileira vigente. Valores estimativos.
        </p>
      </div>
    </div>
  );
};

export default Simulador;
