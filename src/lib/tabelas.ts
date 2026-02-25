// Tabelas INSS e IRRF vigentes (2024)
// Configuráveis via localStorage

export interface FaixaINSS {
  ate: number;
  aliquota: number; // percentual ex: 7.5
}

export interface FaixaIRRF {
  ate: number; // Infinity para última faixa
  aliquota: number;
  deducao: number;
}

export const TABELA_INSS_PADRAO: FaixaINSS[] = [
  { ate: 1412.00, aliquota: 7.5 },
  { ate: 2666.68, aliquota: 9 },
  { ate: 4000.03, aliquota: 12 },
  { ate: 7786.02, aliquota: 14 },
];

export const TABELA_IRRF_PADRAO: FaixaIRRF[] = [
  { ate: 2259.20, aliquota: 0, deducao: 0 },
  { ate: 2826.65, aliquota: 7.5, deducao: 169.44 },
  { ate: 3751.05, aliquota: 15, deducao: 381.44 },
  { ate: 4664.68, aliquota: 22.5, deducao: 662.77 },
  { ate: Infinity, aliquota: 27.5, deducao: 896.00 },
];

export const DEDUCAO_DEPENDENTE = 189.59;

// Seguro-Desemprego 2024
export interface FaixaSeguroDesemprego {
  ate: number;
  fator: number; // multiplicador
  adicional: number;
}

export const TABELA_SEGURO_DESEMPREGO: FaixaSeguroDesemprego[] = [
  { ate: 2041.39, fator: 0.8, adicional: 0 },
  { ate: 3402.65, fator: 0.5, adicional: 1633.10 },
  { ate: Infinity, fator: 0, adicional: 2313.74 }, // teto
];

export const TETO_SEGURO_DESEMPREGO = 2313.74;

const STORAGE_KEY_INSS = 'clt_tabela_inss';
const STORAGE_KEY_IRRF = 'clt_tabela_irrf';

export function carregarTabelaINSS(): FaixaINSS[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INSS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [...TABELA_INSS_PADRAO];
}

export function salvarTabelaINSS(tabela: FaixaINSS[]): void {
  localStorage.setItem(STORAGE_KEY_INSS, JSON.stringify(tabela));
}

export function carregarTabelaIRRF(): FaixaIRRF[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_IRRF);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Restore Infinity for last item
      if (parsed.length > 0) parsed[parsed.length - 1].ate = Infinity;
      return parsed;
    }
  } catch {}
  return [...TABELA_IRRF_PADRAO];
}

export function salvarTabelaIRRF(tabela: FaixaIRRF[]): void {
  localStorage.setItem(STORAGE_KEY_IRRF, JSON.stringify(tabela));
}

export function resetarTabelas(): void {
  localStorage.removeItem(STORAGE_KEY_INSS);
  localStorage.removeItem(STORAGE_KEY_IRRF);
}

// Cálculo progressivo INSS
export function calcularINSS(base: number, tabela?: FaixaINSS[]): { valor: number; baseCalculo: number } {
  const faixas = tabela || carregarTabelaINSS();
  let inss = 0;
  let anterior = 0;

  for (const faixa of faixas) {
    if (base <= anterior) break;
    const teto = Math.min(base, faixa.ate);
    const faixaBase = teto - anterior;
    inss += faixaBase * (faixa.aliquota / 100);
    anterior = faixa.ate;
  }

  return { valor: Math.round(inss * 100) / 100, baseCalculo: Math.min(base, faixas[faixas.length - 1].ate) };
}

// Cálculo progressivo IRRF
export function calcularIRRF(
  baseTributavel: number,
  inss: number,
  dependentes: number,
  tabela?: FaixaIRRF[]
): { valor: number; baseCalculo: number; faixaAplicada: string } {
  const faixas = tabela || carregarTabelaIRRF();
  const deducaoDep = dependentes * DEDUCAO_DEPENDENTE;
  const base = baseTributavel - inss - deducaoDep;

  if (base <= 0) return { valor: 0, baseCalculo: 0, faixaAplicada: 'Isento' };

  let faixaAplicada = 'Isento';
  let irrf = 0;

  for (const faixa of faixas) {
    if (base <= faixa.ate) {
      irrf = base * (faixa.aliquota / 100) - faixa.deducao;
      faixaAplicada = faixa.aliquota === 0 ? 'Isento' : `${faixa.aliquota}%`;
      break;
    }
  }

  return {
    valor: Math.max(0, Math.round(irrf * 100) / 100),
    baseCalculo: Math.round(base * 100) / 100,
    faixaAplicada,
  };
}

// Seguro-Desemprego
export function calcularSeguroDesemprego(
  mediaSalarios: number,
  mesesTrabalhados: number
): { valorParcela: number; parcelas: number; total: number } | null {
  // Mínimo de 6 meses para primeira solicitação (simplificado)
  if (mesesTrabalhados < 6) return null;

  let valorParcela = 0;
  for (const faixa of TABELA_SEGURO_DESEMPREGO) {
    if (mediaSalarios <= faixa.ate) {
      if (faixa.fator > 0) {
        valorParcela = faixa.adicional > 0
          ? (mediaSalarios - TABELA_SEGURO_DESEMPREGO[0].ate) * faixa.fator + faixa.adicional
          : mediaSalarios * faixa.fator;
      } else {
        valorParcela = faixa.adicional; // teto
      }
      break;
    }
  }

  valorParcela = Math.min(valorParcela, TETO_SEGURO_DESEMPREGO);
  valorParcela = Math.round(valorParcela * 100) / 100;

  // Parcelas conforme tempo trabalhado
  let parcelas = 3;
  if (mesesTrabalhados >= 24) parcelas = 5;
  else if (mesesTrabalhados >= 12) parcelas = 4;

  return {
    valorParcela,
    parcelas,
    total: Math.round(valorParcela * parcelas * 100) / 100,
  };
}
