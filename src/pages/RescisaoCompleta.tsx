import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageHeader from '@/components/PageHeader';
import ResultadoCard from '@/components/ResultadoCard';
import HistoricoAumentos from '@/components/HistoricoAumentos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  calcularRescisao,
  salvarHistorico,
  formatarMoeda,
  TipoRescisao,
  DadosRescisao,
  ResultadoRescisao,
  AumentoSalarial,
} from '@/lib/calculadora';
import { calcularINSS, calcularIRRF, calcularSeguroDesemprego } from '@/lib/tabelas';
import { gerarRelatorioPDF } from '@/lib/gerarPDF';
import { isModoRH } from '@/lib/userConfig';
import { toast } from 'sonner';
import { FileDown, Save, User } from 'lucide-react';

const tiposRescisao: { value: TipoRescisao; label: string }[] = [
  { value: 'sem_justa_causa', label: 'Sem Justa Causa' },
  { value: 'pedido_demissao', label: 'Pedido de Demissão' },
  { value: 'justa_causa', label: 'Justa Causa' },
];

const RescisaoCompleta = () => {
  const navigate = useNavigate();
  const isRH = isModoRH();
  const [tipo, setTipo] = useState<TipoRescisao>('sem_justa_causa');
  const [salario, setSalario] = useState('');
  const [dataAdmissao, setDataAdmissao] = useState('');
  const [dataDemissao, setDataDemissao] = useState('');
  const [saldoFGTS, setSaldoFGTS] = useState('');
  const [dependentes, setDependentes] = useState('0');
  const [nomeFuncionario, setNomeFuncionario] = useState('');

  // Férias - modo RH (original)
  const [temFeriasVencidas, setTemFeriasVencidas] = useState(false);
  const [periodosVencidos, setPeriodosVencidos] = useState('0');
  const [periodosEmDobro, setPeriodosEmDobro] = useState('0');

  // Férias - modo Trabalhador
  const [ultimasFeriasData, setUltimasFeriasData] = useState('');
  const [naoLembraFerias, setNaoLembraFerias] = useState(false);
  const [diasFeriasGozadas, setDiasFeriasGozadas] = useState('30');
  const [vendeuFerias, setVendeuFerias] = useState(false);
  const [diasVendidos, setDiasVendidos] = useState('10');
  const [feriasManualPeriodos, setFeriasManualPeriodos] = useState('0');

  const [resultado, setResultado] = useState<ResultadoRescisao | null>(null);
  const [aumentos, setAumentos] = useState<AumentoSalarial[]>([]);
  const [dadosCalculo, setDadosCalculo] = useState<{
    inssValor: number;
    irrfValor: number;
    irrfFaixa: string;
    inssBase: number;
    irrfBase: number;
    totalBruto: number;
    totalDescontos: number;
    totalLiquido: number;
    seguroDesemprego: { valorParcela: number; parcelas: number; total: number } | null;
    dados: DadosRescisao;
  } | null>(null);

  // Calcula períodos vencidos baseado nas últimas férias (modo trabalhador)
  const calcularPeriodosAutomatico = (admissaoStr: string, demissaoStr: string) => {
    if (naoLembraFerias) {
      return {
        vencidos: parseInt(feriasManualPeriodos) || 0,
        dobro: 0,
      };
    }
    if (!ultimasFeriasData || !admissaoStr || !demissaoStr) return { vencidos: 0, dobro: 0 };

    const ultimasFerias = new Date(ultimasFeriasData);
    const demissao = new Date(demissaoStr);
    const admissao = new Date(admissaoStr);

    const mesesDesdeFerias = Math.floor(
      (demissao.getTime() - ultimasFerias.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    );

    let vencidos = 0;
    let dobro = 0;

    if (mesesDesdeFerias > 12) {
      const periodosTotal = Math.floor(mesesDesdeFerias / 12);
      // Check if any are em dobro (> 24 months since last vacation)
      if (mesesDesdeFerias > 24) {
        dobro = Math.floor((mesesDesdeFerias - 12) / 12);
        vencidos = Math.max(0, periodosTotal - dobro);
      } else {
        vencidos = periodosTotal;
      }
    }

    return { vencidos, dobro };
  };

  const handleCalcular = () => {
    if (isRH && !nomeFuncionario.trim()) {
      toast.error('Informe o nome ou registro do funcionário');
      return;
    }

    const sal = parseFloat(salario.replace(/\./g, '').replace(',', '.'));
    if (!sal || sal <= 0) {
      toast.error('Informe um salário válido');
      return;
    }
    if (!dataAdmissao || !dataDemissao) {
      toast.error('Informe as datas de admissão e demissão');
      return;
    }
    const admissao = new Date(dataAdmissao);
    const demissao = new Date(dataDemissao);
    if (demissao <= admissao) {
      toast.error('Data de demissão deve ser posterior à admissão');
      return;
    }
    const hoje = new Date();
    hoje.setHours(23, 59, 59);
    if (demissao > hoje) {
      toast.error('Data de demissão não pode ser futura');
      return;
    }

    const fgts = saldoFGTS ? parseFloat(saldoFGTS.replace(/\./g, '').replace(',', '.')) : undefined;
    const numDependentes = parseInt(dependentes) || 0;

    // Determine férias vencidas
    let pVencidos: number | undefined;
    let pDobro: number | undefined;

    if (isRH) {
      pVencidos = temFeriasVencidas ? parseInt(periodosVencidos) || 0 : undefined;
      pDobro = temFeriasVencidas ? parseInt(periodosEmDobro) || 0 : undefined;
    } else {
      const auto = calcularPeriodosAutomatico(dataAdmissao, dataDemissao);
      if (auto.vencidos > 0 || auto.dobro > 0) {
        pVencidos = auto.vencidos;
        pDobro = auto.dobro;
      }
    }

    const dados: DadosRescisao = {
      salario: sal,
      dataAdmissao: admissao,
      dataDemissao: demissao,
      tipoRescisao: tipo,
      saldoFGTS: fgts,
      periodosVencidosManuais: pVencidos,
      periodosEmDobroManuais: pDobro,
      aumentos: aumentos.length > 0 ? aumentos : undefined,
      nomeFuncionario: nomeFuncionario.trim() || undefined,
    };

    const res = calcularRescisao(dados);
    setResultado(res);
    // Histórico agora é salvo manualmente pelo botão "Salvar no Histórico"

    const baseINSS = res.saldoSalario + res.avisoPrevio + res.decimoTerceiro;
    const inss = calcularINSS(baseINSS);
    const irrf = calcularIRRF(baseINSS, inss.valor, numDependentes);

    const totalBruto = res.totalGeral;
    const totalDescontos = Math.round((inss.valor + irrf.valor) * 100) / 100;
    const totalLiquido = Math.round((totalBruto - totalDescontos) * 100) / 100;

    let seguro = null;
    if (tipo === 'sem_justa_causa') {
      seguro = calcularSeguroDesemprego(sal, res.mesesTotais);
    }

    setDadosCalculo({
      inssValor: inss.valor,
      irrfValor: irrf.valor,
      irrfFaixa: irrf.faixaAplicada,
      inssBase: inss.baseCalculo,
      irrfBase: irrf.baseCalculo,
      totalBruto,
      totalDescontos,
      totalLiquido,
      seguroDesemprego: seguro,
      dados,
    });

    toast.success('Cálculo realizado com sucesso!');
  };

  const handleGerarPDF = async () => {
    if (!resultado || !dadosCalculo) return;
    try {
      const nomeArquivo = await gerarRelatorioPDF({
        dados: dadosCalculo.dados,
        resultado,
        inssValor: dadosCalculo.inssValor,
        irrfValor: dadosCalculo.irrfValor,
        totalBruto: dadosCalculo.totalBruto,
        totalDescontos: dadosCalculo.totalDescontos,
        totalLiquido: dadosCalculo.totalLiquido,
        dependentes: parseInt(dependentes) || 0,
        seguroDesemprego: dadosCalculo.seguroDesemprego,
      });
      toast.success(`✅ PDF salvo: ${nomeArquivo}`, { description: 'Verifique a pasta Downloads' });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF');
    }
  };

  const handleSalvarHistorico = () => {
    if (!resultado || !dadosCalculo) return;
    salvarHistorico(dadosCalculo.dados, resultado);
    toast.success('💾 Cálculo salvo no histórico', { description: 'Consulte em "Histórico"' });
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <PageHeader
        title="Rescisão Completa"
        subtitle="Preencha os dados para simular"
      />

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

        {/* Tipo de Rescisão */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl card-shadow p-4"
        >
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
            Tipo de Rescisão
          </Label>
          <div className="grid grid-cols-1 gap-2">
            {tiposRescisao.map((t) => (
              <button
                key={t.value}
                onClick={() => setTipo(t.value)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  tipo === t.value
                    ? 'gradient-card text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Form Fields */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl card-shadow p-4 space-y-4"
        >
          <div>
            <Label htmlFor="salario" className="text-xs font-medium text-muted-foreground">
              Salário Bruto (R$)
            </Label>
            <Input
              id="salario"
              type="text"
              inputMode="decimal"
              placeholder="3.500,00"
              value={salario}
              onChange={(e) => setSalario(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="admissao" className="text-xs font-medium text-muted-foreground">
                Data Admissão
              </Label>
              <Input
                id="admissao"
                type="date"
                value={dataAdmissao}
                onChange={(e) => setDataAdmissao(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="demissao" className="text-xs font-medium text-muted-foreground">
                Data Demissão
              </Label>
              <Input
                id="demissao"
                type="date"
                value={dataDemissao}
                onChange={(e) => setDataDemissao(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="fgts" className="text-xs font-medium text-muted-foreground">
                Saldo FGTS (opcional)
              </Label>
              <Input
                id="fgts"
                type="text"
                inputMode="decimal"
                placeholder="Deixe vazio p/ estimar"
                value={saldoFGTS}
                onChange={(e) => setSaldoFGTS(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="dependentes" className="text-xs font-medium text-muted-foreground">
                Nº Dependentes (IRRF)
              </Label>
              <Input
                id="dependentes"
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="0"
                value={dependentes}
                onChange={(e) => setDependentes(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </motion.div>

        {/* Histórico de Aumentos */}
        <HistoricoAumentos
          aumentos={aumentos}
          onChange={setAumentos}
          dataAdmissao={dataAdmissao}
          dataDemissao={dataDemissao}
        />

        {/* Férias - Modo RH (original) */}
        {isRH && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card rounded-xl card-shadow p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Férias vencidas não gozadas?
              </Label>
              <Switch checked={temFeriasVencidas} onCheckedChange={setTemFeriasVencidas} />
            </div>
            {temFeriasVencidas && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="grid grid-cols-2 gap-3"
              >
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">
                    Períodos vencidos
                  </Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={periodosVencidos}
                    onChange={(e) => setPeriodosVencidos(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">
                    Períodos em dobro
                  </Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={periodosEmDobro}
                    onChange={(e) => setPeriodosEmDobro(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-[9px] text-muted-foreground mt-0.5">Ultrapassaram prazo concessivo</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Férias - Modo Trabalhador */}
        {!isRH && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card rounded-xl card-shadow p-4 space-y-3"
          >
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              🏖️ Últimas Férias Gozadas
            </Label>

            <div>
              <Label className="text-xs font-medium text-muted-foreground">
                Data de início das últimas férias
              </Label>
              <Input
                type="date"
                value={ultimasFeriasData}
                onChange={(e) => { setUltimasFeriasData(e.target.value); setNaoLembraFerias(false); }}
                disabled={naoLembraFerias}
                className="mt-1"
              />
              <div className="flex items-center gap-2 mt-2">
                <Switch
                  checked={naoLembraFerias}
                  onCheckedChange={(v) => { setNaoLembraFerias(v); if (v) setUltimasFeriasData(''); }}
                  id="nao-lembra"
                />
                <Label htmlFor="nao-lembra" className="text-xs text-muted-foreground cursor-pointer">
                  Não me lembro / Primeiro emprego
                </Label>
              </div>
            </div>

            {naoLembraFerias && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <Label className="text-xs font-medium text-muted-foreground">
                  Períodos vencidos (se souber)
                </Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={feriasManualPeriodos}
                  onChange={(e) => setFeriasManualPeriodos(e.target.value)}
                  className="mt-1"
                  placeholder="0"
                />
              </motion.div>
            )}

            {!naoLembraFerias && (
              <>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">
                    Quantos dias de férias gozadas?
                  </Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="30"
                    value={diasFeriasGozadas}
                    onChange={(e) => setDiasFeriasGozadas(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch checked={vendeuFerias} onCheckedChange={setVendeuFerias} id="vendeu" />
                  <Label htmlFor="vendeu" className="text-xs text-muted-foreground cursor-pointer">
                    Vendeu dias de férias (abono pecuniário)?
                  </Label>
                </div>
                {vendeuFerias && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Label className="text-xs font-medium text-muted-foreground">Dias vendidos</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      max="10"
                      value={diasVendidos}
                      onChange={(e) => setDiasVendidos(e.target.value)}
                      className="mt-1"
                    />
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* Calculate Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            onClick={handleCalcular}
            className="w-full gradient-card text-primary-foreground font-bold py-6 text-base rounded-xl card-shadow-lg"
          >
            Calcular Rescisão
          </Button>
        </motion.div>

        {/* Results */}
        {resultado && dadosCalculo && (
          <>
            {resultado.historicoAumentos && resultado.historicoAumentos.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl card-shadow p-4 space-y-2"
              >
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Evolução Salarial
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Salário inicial</span>
                  <span className="font-medium">{formatarMoeda(dadosCalculo.dados.salario)}</span>
                </div>
                {resultado.historicoAumentos.map((h, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {new Date(h.data).toLocaleDateString('pt-BR')} ({h.tipo === 'percentual' ? `+${h.valor}%` : `+${formatarMoeda(h.valor)}`})
                    </span>
                    <span className="font-medium">{formatarMoeda(h.salarioResultante)}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-2 flex justify-between text-sm font-bold">
                  <span>Salário final</span>
                  <span className="text-primary">{formatarMoeda(resultado.salarioFinal)}</span>
                </div>
              </motion.div>
            )}

            <ResultadoCard
              resultado={resultado}
              tipoRescisao={tipo}
              inssValor={dadosCalculo.inssValor}
              irrfValor={dadosCalculo.irrfValor}
              irrfFaixa={dadosCalculo.irrfFaixa}
              inssBase={dadosCalculo.inssBase}
              irrfBase={dadosCalculo.irrfBase}
              totalBruto={dadosCalculo.totalBruto}
              totalDescontos={dadosCalculo.totalDescontos}
              totalLiquido={dadosCalculo.totalLiquido}
              seguroDesemprego={dadosCalculo.seguroDesemprego}
            />

            <div className="space-y-2">
              <Button
                onClick={handleGerarPDF}
                className="w-full gradient-card text-primary-foreground py-5 rounded-xl font-semibold gap-2"
              >
                <FileDown className="h-4 w-4" />
                📄 Gerar Relatório PDF
              </Button>
              <p className="text-[9px] text-muted-foreground text-center">Salva arquivo na pasta Downloads</p>

              <Button
                onClick={handleSalvarHistorico}
                variant="outline"
                className="w-full py-5 rounded-xl font-semibold gap-2"
              >
                <Save className="h-4 w-4" />
                💾 Salvar no Histórico
              </Button>
              <p className="text-[9px] text-muted-foreground text-center">Guarda no app para consultar depois</p>
            </div>
          </>
        )}

        <p className="text-[10px] text-muted-foreground text-center px-4 pt-2">
          Simulação baseada na legislação trabalhista brasileira vigente. Valores estimativos.
        </p>
      </div>
    </div>
  );
};

export default RescisaoCompleta;
