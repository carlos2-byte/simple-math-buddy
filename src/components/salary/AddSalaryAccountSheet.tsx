import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SalaryAccount } from '@/lib/salaryAccounts';

interface AddSalaryAccountSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (account: Omit<SalaryAccount, 'id'>) => Promise<SalaryAccount>;
}

export function AddSalaryAccountSheet({ open, onOpenChange, onSubmit }: AddSalaryAccountSheetProps) {
  const [name, setName] = useState('');
  const [payDay, setPayDay] = useState('5');
  const [canReceiveTransfers, setCanReceiveTransfers] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setPayDay('5');
    setCanReceiveTransfers(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        payDay: parseInt(payDay),
        canReceiveTransfers,
      });
      resetForm();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Nova Conta Salário</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pb-6">
          <div className="space-y-2">
            <Label htmlFor="accountName">Nome da Conta</Label>
            <Input
              id="accountName"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Itaú Salário, Nubank..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Dia do Pagamento</Label>
            <Select value={payDay} onValueChange={setPayDay}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {days.map(d => <SelectItem key={d} value={String(d)}>Dia {d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
            <div className="space-y-0.5">
              <Label>Pode receber transferências</Label>
              <p className="text-xs text-muted-foreground">
                Permitir transferências de outras contas
              </p>
            </div>
            <Switch checked={canReceiveTransfers} onCheckedChange={setCanReceiveTransfers} />
          </div>

          <div className="p-3 border rounded-lg bg-muted/10">
            <p className="text-xs text-muted-foreground">
              💡 Para adicionar saldo, lance uma receita na Home vinculada a esta conta.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Adicionar Conta'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
