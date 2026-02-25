// CLT Severance Calculation Engine
// Based on Brazilian labor legislation (CLT)

export type TipoRescisao = 'sem_justa_causa' | 'justa_causa' | 'pedido_demissao';

export type TipoAumento = 'percentual' | 'valor_fixo';

export interface AumentoSalarial {
  id: string;
  data: Date;
  tipo: TipoAumento;
  valor: number; // percentual (ex: 5 para 5%) ou valor fixo em R$
}

export interface DadosRescisao {
  salario: number;
  dataAdmissao: Date;
  dataDemissao: Date;
  tipoRescisao: TipoRescisao;
  saldoFGTS?: number;
  periodosVencidosManuais?: number;
  periodosEmDobroManuais?: number;
  aumentos?: AumentoSalarial[];
  nomeFuncionario?: string;
}

export interface ResultadoRescisao {
  saldoSalario: number;
  feriasVencidas: number;
  feriasDobro: number;
  feriasProporcionais: number;
  totalFerias: number;
  decimoTerceiro: number;
  avisoPrevio: number;
  avisoPrevioDias: number;
  fgtsTotal: number;
  multaFGTS: number;
  totalGeral: number;
  mesesTotais: number;
  anosCompletos: number;
  mesesRestantes: number;
  diasTrabalhadosMesDemissao: number;
  periodosVencidos: number;
  periodosEmDobro: number;
  salarioFinal: number;
  historicoAumentos?: { data: Date; tipo: TipoAumento; valor: number; salarioResultante: number }[];
}

// Calcula o salário vigente em uma data, dado o salário inicial e os aumentos
export function calcularSalarioVigente(
  salarioInicial: number,
  aumentos: AumentoSalarial[],
  dataReferencia: Date
): number {
  const ordenados = [...aumentos].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  let salario = salarioInicial;
  for (const aumento of ordenados) {
    const dataAumento = new Date(aumento.data);
    if (dataAumento <= dataReferencia) {
      if (aumento.tipo === 'percentual') {
        salario = salario * (1 + aumento.valor / 100);
      } else {
        salario = salario + aumento.valor;
      }
    }
  }
  return Math.round(salario * 100) / 100;
}

// Gera o histórico completo de salários com cada aumento aplicado
export function gerarHistoricoSalarios(
  salarioInicial: number,
  aumentos: AumentoSalarial[]
): { data: Date; tipo: TipoAumento; valor: number; salarioResultante: number }[] {
  const ordenados = [...aumentos].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  const historico: { data: Date; tipo: TipoAumento; valor: number; salarioResultante: number }[] = [];
  let salario = salarioInicial;
  for (const aumento of ordenados) {
    if (aumento.tipo === 'percentual') {
      salario = salario * (1 + aumento.valor / 100);
    } else {
      salario = salario + aumento.valor;
    }
    salario = Math.round(salario * 100) / 100;
    historico.push({ data: new Date(aumento.data), tipo: aumento.tipo, valor: aumento.valor, salarioResultante: salario });
  }
  return historico;
}

// Calcula FGTS acumulado mês a mês com aumentos
function calcularFGTSComAumentos(
  salarioInicial: number,
  aumentos: AumentoSalarial[],
  dataAdmissao: Date,
  dataDemissao: Date
): number {
  let total = 0;
  const current = new Date(dataAdmissao.getFullYear(), dataAdmissao.getMonth(), 1);
  const fim = new Date(dataDemissao.getFullYear(), dataDemissao.getMonth(), 1);
  
  while (current <= fim) {
    const salarioMes = calcularSalarioVigente(salarioInicial, aumentos, current);
    total += salarioMes * 0.08;
    current.setMonth(current.getMonth() + 1);
  }
  return Math.round(total * 100) / 100;
}

function diffMeses(dataInicio: Date, dataFim: Date): number {
  const anos = dataFim.getFullYear() - dataInicio.getFullYear();
  const meses = dataFim.getMonth() - dataInicio.getMonth();
  const dias = dataFim.getDate() - dataInicio.getDate();
  
  let total = anos * 12 + meses;
  
  // If worked 15+ days in the month, count as full month
  if (dias >= 15) {
    total += 1;
  } else if (dias < 0) {
    const lastDayPrevMonth = new Date(dataFim.getFullYear(), dataFim.getMonth(), 0).getDate();
    const diasRestantes = lastDayPrevMonth + dias;
    if (diasRestantes >= 15) {
      // keep total as is (the partial month counts)
    } else {
      total -= 1;
    }
  }
  
  return Math.max(0, total);
}

function diasNoMes(data: Date): number {
  return data.getDate();
}

function calcularPeriodosFerias(dataAdmissao: Date, dataDemissao: Date): {
  periodosVencidos: number;
  periodosEmDobro: number;
  mesesProporcional: number;
} {
  let periodosVencidos = 0;
  let periodosEmDobro = 0;
  
  const mesesTotais = diffMeses(dataAdmissao, dataDemissao);
  const anosCompletos = Math.floor(mesesTotais / 12);
  const mesesProporcional = mesesTotais % 12;
  
  for (let i = 0; i < anosCompletos; i++) {
    const fimAquisitivo = new Date(dataAdmissao);
    fimAquisitivo.setFullYear(fimAquisitivo.getFullYear() + i + 1);
    
    const limiteConcessivo = new Date(fimAquisitivo);
    limiteConcessivo.setFullYear(limiteConcessivo.getFullYear() + 1);
    
    if (dataDemissao > limiteConcessivo) {
      periodosEmDobro++;
    } else {
      periodosVencidos++;
    }
  }
  
  return { periodosVencidos, periodosEmDobro, mesesProporcional };
}

export function calcularRescisao(dados: DadosRescisao): ResultadoRescisao {
  const { salario, dataAdmissao, dataDemissao, tipoRescisao, saldoFGTS } = dados;
  const aumentos = dados.aumentos || [];
  const temAumentos = aumentos.length > 0;
  
  // Salário final (último salário vigente)
  const salarioFinal = temAumentos
    ? calcularSalarioVigente(salario, aumentos, dataDemissao)
    : salario;
  
  const mesesTotais = diffMeses(dataAdmissao, dataDemissao);
  const anosCompletos = Math.floor(mesesTotais / 12);
  const mesesRestantes = mesesTotais % 12;
  const diasTrabalhadosMesDemissao = diasNoMes(dataDemissao);
  
  // 1. Saldo de Salário - usa salário final
  const saldoSalario = round((salarioFinal / 30) * diasTrabalhadosMesDemissao);
  
  // 2. Férias - vencidas e em dobro usam salário vigente na rescisão; proporcionais usam salário atual
  const periodosAuto = calcularPeriodosFerias(dataAdmissao, dataDemissao);
  const periodos = {
    periodosVencidos: dados.periodosVencidosManuais ?? periodosAuto.periodosVencidos,
    periodosEmDobro: dados.periodosEmDobroManuais ?? periodosAuto.periodosEmDobro,
    mesesProporcional: periodosAuto.mesesProporcional,
  };
  
  const valorFeriasUmPeriodo = salarioFinal + salarioFinal / 3;
  
  let feriasVencidas = 0;
  let feriasDobro = 0;
  let feriasProporcionais = 0;
  
  if (tipoRescisao === 'justa_causa') {
    feriasVencidas = round(periodos.periodosVencidos * valorFeriasUmPeriodo);
    feriasDobro = round(periodos.periodosEmDobro * valorFeriasUmPeriodo * 2);
    feriasProporcionais = 0;
  } else {
    feriasVencidas = round(periodos.periodosVencidos * valorFeriasUmPeriodo);
    feriasDobro = round(periodos.periodosEmDobro * valorFeriasUmPeriodo * 2);
    
    if (mesesRestantes > 0) {
      const base = (salarioFinal / 12) * mesesRestantes;
      feriasProporcionais = round(base + base / 3);
    }
  }
  
  const totalFerias = round(feriasVencidas + feriasDobro + feriasProporcionais);
  
  // 3. 13º Proporcional - usa salário final
  let decimoTerceiro = 0;
  if (tipoRescisao !== 'justa_causa') {
    const inicioAno = new Date(dataDemissao.getFullYear(), 0, 1);
    const dataRef = dataAdmissao > inicioAno ? dataAdmissao : inicioAno;
    const meses13 = diffMeses(dataRef, dataDemissao);
    decimoTerceiro = round((salarioFinal / 12) * Math.min(meses13, 12));
  }
  
  // 4. Aviso Prévio - usa salário final
  let avisoPrevioDias = 0;
  let avisoPrevio = 0;
  if (tipoRescisao === 'sem_justa_causa') {
    avisoPrevioDias = Math.min(30 + 3 * anosCompletos, 90);
    avisoPrevio = round((salarioFinal / 30) * avisoPrevioDias);
  }
  
  // 5. FGTS - com aumentos, calcula mês a mês
  let fgtsTotal: number;
  if (saldoFGTS != null) {
    fgtsTotal = round(saldoFGTS);
  } else if (temAumentos) {
    fgtsTotal = calcularFGTSComAumentos(salario, aumentos, dataAdmissao, dataDemissao);
  } else {
    fgtsTotal = round(salario * 0.08 * mesesTotais);
  }
  
  // 6. Multa 40% FGTS
  let multaFGTS = 0;
  if (tipoRescisao === 'sem_justa_causa') {
    multaFGTS = round(fgtsTotal * 0.4);
  }
  
  // Total
  let totalGeral = 0;
  if (tipoRescisao === 'sem_justa_causa') {
    totalGeral = round(saldoSalario + totalFerias + decimoTerceiro + avisoPrevio + multaFGTS);
  } else if (tipoRescisao === 'pedido_demissao') {
    totalGeral = round(saldoSalario + totalFerias + decimoTerceiro);
  } else {
    totalGeral = round(saldoSalario + feriasVencidas + feriasDobro);
  }
  
  // Histórico de aumentos para exibição
  const historicoAumentos = temAumentos ? gerarHistoricoSalarios(salario, aumentos) : undefined;
  
  return {
    saldoSalario,
    feriasVencidas,
    feriasDobro,
    feriasProporcionais,
    totalFerias,
    decimoTerceiro,
    avisoPrevio,
    avisoPrevioDias,
    fgtsTotal,
    multaFGTS,
    totalGeral,
    mesesTotais,
    anosCompletos,
    mesesRestantes,
    diasTrabalhadosMesDemissao,
    periodosVencidos: periodos.periodosVencidos,
    periodosEmDobro: periodos.periodosEmDobro,
    salarioFinal,
    historicoAumentos,
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
}

export function labelTipoRescisao(tipo: TipoRescisao): string {
  switch (tipo) {
    case 'sem_justa_causa': return 'Sem Justa Causa';
    case 'justa_causa': return 'Justa Causa';
    case 'pedido_demissao': return 'Pedido de Demissão';
  }
}

// History management
export interface HistoricoItem {
  id: string;
  data: Date;
  dados: DadosRescisao;
  resultado: ResultadoRescisao;
}

export function salvarHistorico(dados: DadosRescisao, resultado: ResultadoRescisao): void {
  const historico = carregarHistorico();
  const item: HistoricoItem = {
    id: Date.now().toString(),
    data: new Date(),
    dados: { ...dados },
    resultado: { ...resultado },
  };
  historico.unshift(item);
  if (historico.length > 20) historico.pop();
  localStorage.setItem('clt_historico', JSON.stringify(historico));
}

export function carregarHistorico(): HistoricoItem[] {
  try {
    const raw = localStorage.getItem('clt_historico');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function limparHistorico(): void {
  localStorage.removeItem('clt_historico');
}
