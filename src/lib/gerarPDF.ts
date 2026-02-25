import jsPDF from 'jspdf';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { ResultadoRescisao, formatarMoeda, labelTipoRescisao, TipoRescisao, DadosRescisao, TipoAumento } from './calculadora';

interface DadosPDF {
  dados: DadosRescisao;
  resultado: ResultadoRescisao;
  inssValor: number;
  irrfValor: number;
  totalBruto: number;
  totalDescontos: number;
  totalLiquido: number;
  dependentes: number;
  seguroDesemprego?: { valorParcela: number; parcelas: number; total: number } | null;
}

function sanitizarNome(nome: string): string {
  return nome
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_]/g, '')
    .substring(0, 30);
}

function gerarNomeArquivo(nomeFuncionario?: string): string {
  const agora = new Date();
  const dataStr = agora.toLocaleDateString('pt-BR').replace(/\//g, '-');
  const horaStr = agora.toLocaleTimeString('pt-BR').replace(/:/g, '-');
  const nome = nomeFuncionario?.trim()
    ? sanitizarNome(nomeFuncionario)
    : 'TRABALHADOR';
  return `rescisao_${nome}_${dataStr}_${horaStr}.pdf`;
}

function construirPDF(dadosPDF: DadosPDF): jsPDF {
  const { dados, resultado, inssValor, irrfValor, totalBruto, totalDescontos, totalLiquido, dependentes, seguroDesemprego } = dadosPDF;
  const doc = new jsPDF();
  const agora = new Date();

  let y = 20;
  const marginLeft = 20;
  const pageWidth = 170;

  const checkNewPage = () => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  };

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório de Rescisão Trabalhista', marginLeft, y);
  y += 10;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Data/Hora do Cálculo: ${agora.toLocaleDateString('pt-BR')} ${agora.toLocaleTimeString('pt-BR')}`, marginLeft, y);
  y += 12;

  doc.setDrawColor(200);
  doc.line(marginLeft, y, marginLeft + pageWidth, y);
  y += 8;

  if (dados.nomeFuncionario) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Funcionário: ${dados.nomeFuncionario}`, marginLeft, y);
    y += 8;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Dados Informados', marginLeft, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const infos = [
    `Tipo: ${labelTipoRescisao(dados.tipoRescisao)}`,
    `Salário Inicial: ${formatarMoeda(dados.salario)}`,
    ...(resultado.salarioFinal !== dados.salario ? [`Salário Final: ${formatarMoeda(resultado.salarioFinal)}`] : []),
    `Admissão: ${dados.dataAdmissao instanceof Date ? dados.dataAdmissao.toLocaleDateString('pt-BR') : new Date(dados.dataAdmissao).toLocaleDateString('pt-BR')}`,
    `Demissão: ${dados.dataDemissao instanceof Date ? dados.dataDemissao.toLocaleDateString('pt-BR') : new Date(dados.dataDemissao).toLocaleDateString('pt-BR')}`,
    `Tempo: ${resultado.mesesTotais} meses (${resultado.anosCompletos}a ${resultado.mesesRestantes}m)`,
    `Dependentes: ${dependentes}`,
  ];
  infos.forEach(info => {
    doc.text(info, marginLeft, y);
    y += 6;
  });
  y += 4;

  // Histórico de Aumentos
  if (resultado.historicoAumentos && resultado.historicoAumentos.length > 0) {
    doc.line(marginLeft, y, marginLeft + pageWidth, y);
    y += 8;
    checkNewPage();
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Histórico de Aumentos Salariais', marginLeft, y);
    y += 7;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Data', marginLeft, y);
    doc.text('Tipo', marginLeft + 35, y);
    doc.text('Valor', marginLeft + 70, y);
    doc.text('Novo Salário', marginLeft + pageWidth, y, { align: 'right' });
    y += 5;
    doc.setFont('helvetica', 'normal');
    for (const h of resultado.historicoAumentos) {
      checkNewPage();
      const dataStr = new Date(h.data).toLocaleDateString('pt-BR');
      const tipoStr = h.tipo === 'percentual' ? 'Percentual' : 'Valor Fixo';
      const valorStr = h.tipo === 'percentual' ? `+${h.valor}%` : `+${formatarMoeda(h.valor)}`;
      doc.text(dataStr, marginLeft, y);
      doc.text(tipoStr, marginLeft + 35, y);
      doc.text(valorStr, marginLeft + 70, y);
      doc.text(formatarMoeda(h.salarioResultante), marginLeft + pageWidth, y, { align: 'right' });
      y += 5;
    }
    y += 4;
  }

  doc.line(marginLeft, y, marginLeft + pageWidth, y);
  y += 8;
  checkNewPage();

  // Verbas
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Verbas Rescisórias', marginLeft, y);
  y += 7;

  doc.setFontSize(10);
  const addLinha = (label: string, valor: number) => {
    checkNewPage();
    doc.setFont('helvetica', 'normal');
    doc.text(label, marginLeft, y);
    doc.text(formatarMoeda(valor), marginLeft + pageWidth, y, { align: 'right' });
    y += 6;
  };

  addLinha('Saldo de Salário', resultado.saldoSalario);
  if (resultado.feriasVencidas > 0) addLinha('Férias Vencidas', resultado.feriasVencidas);
  if (resultado.feriasDobro > 0) addLinha('Férias em Dobro', resultado.feriasDobro);
  if (resultado.feriasProporcionais > 0) addLinha('Férias Proporcionais', resultado.feriasProporcionais);
  if (resultado.decimoTerceiro > 0) addLinha('13º Proporcional', resultado.decimoTerceiro);
  if (resultado.avisoPrevio > 0) addLinha(`Aviso Prévio (${resultado.avisoPrevioDias} dias)`, resultado.avisoPrevio);
  if (resultado.multaFGTS > 0) addLinha('Multa 40% FGTS', resultado.multaFGTS);

  y += 2;
  doc.setFont('helvetica', 'bold');
  addLinha('TOTAL BRUTO', totalBruto);
  y += 4;

  // Descontos
  doc.line(marginLeft, y, marginLeft + pageWidth, y);
  y += 8;
  checkNewPage();
  doc.setFontSize(12);
  doc.text('Descontos', marginLeft, y);
  y += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  addLinha('INSS', inssValor);
  addLinha('IRRF', irrfValor);
  doc.setFont('helvetica', 'bold');
  addLinha('TOTAL DESCONTOS', totalDescontos);
  y += 4;

  // Total Líquido
  doc.line(marginLeft, y, marginLeft + pageWidth, y);
  y += 8;
  checkNewPage();
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL LÍQUIDO', marginLeft, y);
  doc.text(formatarMoeda(totalLiquido), marginLeft + pageWidth, y, { align: 'right' });
  y += 10;

  // Seguro-Desemprego
  if (seguroDesemprego && dados.tipoRescisao === 'sem_justa_causa') {
    doc.line(marginLeft, y, marginLeft + pageWidth, y);
    y += 8;
    checkNewPage();
    doc.setFontSize(12);
    doc.text('Seguro-Desemprego', marginLeft, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    addLinha('Valor por parcela', seguroDesemprego.valorParcela);
    addLinha(`Parcelas: ${seguroDesemprego.parcelas}`, seguroDesemprego.total);
  }

  // Footer
  y += 10;
  checkNewPage();
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Simulação baseada na legislação trabalhista brasileira vigente. Valores estimativos.', marginLeft, y);

  return doc;
}

export async function gerarRelatorioPDF(dadosPDF: DadosPDF): Promise<string> {
  const doc = construirPDF(dadosPDF);
  const nomeArquivo = gerarNomeArquivo(dadosPDF.dados.nomeFuncionario);

  if (Capacitor.isNativePlatform()) {
    try {
      const pdfBase64 = doc.output('datauristring').split(',')[1];

      const result = await Filesystem.writeFile({
        path: `Download/${nomeArquivo}`,
        data: pdfBase64,
        directory: Directory.ExternalStorage,
        recursive: true,
      });

      console.log('PDF salvo nativamente:', result.uri);

      try {
        await Share.share({
          title: 'Relatório de Rescisão',
          text: `Arquivo salvo em Downloads: ${nomeArquivo}`,
          url: result.uri,
          dialogTitle: 'Abrir PDF',
        });
      } catch {
        // User cancelled share dialog - that's fine
      }

      return nomeArquivo;
    } catch (error) {
      console.error('Erro ao salvar PDF nativamente, usando fallback web:', error);
      doc.save(nomeArquivo);
      return nomeArquivo;
    }
  } else {
    doc.save(nomeArquivo);
    return nomeArquivo;
  }
}
