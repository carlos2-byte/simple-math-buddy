import { useState, useRef, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Download, Share2, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { FinancialSummaryPDF } from './FinancialSummaryPDF';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { StatementItem } from '@/hooks/useStatement';

interface CategoryItem {
  id: string;
  name: string;
  value: number;
  color: string;
}

interface ShareSummarySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: string;
  income: number;
  expense: number;
  currentBalance: number;
  futureCoverage: number;
  categoryData: CategoryItem[];
  totalInvested: number;
  statementItems: StatementItem[];
}

export function ShareSummarySheet({
  open,
  onOpenChange,
  month,
  income,
  expense,
  currentBalance,
  futureCoverage,
  categoryData,
  totalInvested,
  statementItems,
}: ShareSummarySheetProps) {
  const summaryRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState<'pdf' | 'image' | null>(null);

  const captureCanvas = useCallback(async () => {
    if (!summaryRef.current) return null;
    return html2canvas(summaryRef.current, {
      scale: 2,
      backgroundColor: '#0f1729',
      useCORS: true,
      logging: false,
    });
  }, []);

  const handleDownloadPDF = async () => {
    setGenerating('pdf');
    try {
      const canvas = await captureCanvas();
      if (!canvas) return;

      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const x = (pageWidth - imgWidth) / 2;
      const y = 15;

      // Dark background for the page
      pdf.setFillColor(15, 23, 41);
      pdf.rect(0, 0, pageWidth, pdf.internal.pageSize.getHeight(), 'F');

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, imgWidth, imgHeight);
      pdf.save(`resumo-financeiro-${month}.pdf`);

      toast({ title: 'PDF salvo com sucesso!' });
    } catch {
      toast({ title: 'Erro ao gerar PDF', variant: 'destructive' });
    } finally {
      setGenerating(null);
    }
  };

  const handleDownloadImage = async () => {
    setGenerating('image');
    try {
      const canvas = await captureCanvas();
      if (!canvas) return;

      const link = document.createElement('a');
      link.download = `resumo-financeiro-${month}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast({ title: 'Imagem salva com sucesso!' });
    } catch {
      toast({ title: 'Erro ao gerar imagem', variant: 'destructive' });
    } finally {
      setGenerating(null);
    }
  };

  const handleShare = async () => {
    setGenerating('image');
    try {
      const canvas = await captureCanvas();
      if (!canvas) return;

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );

      if (blob && navigator.share) {
        const file = new File([blob], `resumo-financeiro-${month}.png`, { type: 'image/png' });
        await navigator.share({
          title: 'Resumo Financeiro',
          files: [file],
        });
      } else {
        // Fallback: download
        handleDownloadImage();
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        toast({ title: 'Erro ao compartilhar', variant: 'destructive' });
      }
    } finally {
      setGenerating(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl px-0">
        <SheetHeader className="px-4 pb-3">
          <SheetTitle>Compartilhar Resumo</SheetTitle>
        </SheetHeader>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="flex justify-center py-4">
            <FinancialSummaryPDF
              ref={summaryRef}
              month={month}
              income={income}
              expense={expense}
              currentBalance={currentBalance}
              futureCoverage={futureCoverage}
              categoryData={categoryData}
              totalInvested={totalInvested}
              statementItems={statementItems}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-background border-t border-border px-4 py-3 flex gap-2 safe-bottom">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDownloadPDF}
            disabled={!!generating}
          >
            {generating === 'pdf' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            PDF
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDownloadImage}
            disabled={!!generating}
          >
            {generating === 'image' && !navigator.share ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4 mr-2" />
            )}
            Imagem
          </Button>
          {typeof navigator !== 'undefined' && navigator.share && (
            <Button
              className="flex-1"
              onClick={handleShare}
              disabled={!!generating}
            >
              {generating === 'image' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Share2 className="h-4 w-4 mr-2" />
              )}
              Enviar
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
