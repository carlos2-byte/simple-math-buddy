import { forwardRef } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatMonthYear } from '@/lib/formatters';
import { TrendingUp, TrendingDown, Wallet, Shield, Landmark } from 'lucide-react';
import { StatementItem, isConsolidatedInvoice } from '@/hooks/useStatement';
import { formatDateBR } from '@/lib/dateUtils';

interface CategoryItem {
  id: string;
  name: string;
  value: number;
  color: string;
}

interface FinancialSummaryPDFProps {
  month: string;
  income: number;
  expense: number;
  currentBalance: number;
  futureCoverage: number;
  categoryData: CategoryItem[];
  totalInvested: number;
  statementItems: StatementItem[];
}

const RADIAN = Math.PI / 180;

function renderCustomLabel({
  cx, cy, midAngle, innerRadius, outerRadius, percent,
}: {
  cx: number; cy: number; midAngle: number;
  innerRadius: number; outerRadius: number; percent: number;
}) {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export const FinancialSummaryPDF = forwardRef<HTMLDivElement, FinancialSummaryPDFProps>(
  ({ month, income, expense, currentBalance, futureCoverage, categoryData, totalInvested, statementItems }, ref) => {
    const barData = [
      { name: 'Receitas', value: income, fill: '#34d399' },
      { name: 'Despesas', value: expense, fill: '#f87171' },
    ];

    const topCategories = categoryData.slice(0, 6);
    const otherTotal = categoryData.slice(6).reduce((sum, c) => sum + c.value, 0);
    const pieData = otherTotal > 0
      ? [...topCategories, { id: 'other', name: 'Outros', value: otherTotal, color: '#6b7280' }]
      : topCategories;

    // Build transaction list from statement items
    const transactionList: Array<{ date: string; description: string; amount: number; type: 'income' | 'expense' }> = [];
    for (const item of statementItems) {
      if (isConsolidatedInvoice(item)) {
        transactionList.push({
          date: item.dueDate,
          description: `Fatura ${item.cardName}`,
          amount: item.total,
          type: 'expense',
        });
      } else {
        transactionList.push({
          date: item.date,
          description: item.description || (item.type === 'income' ? 'Receita' : 'Despesa'),
          amount: Math.abs(item.amount),
          type: item.type as 'income' | 'expense',
        });
      }
    }
    transactionList.sort((a, b) => a.date.localeCompare(b.date));

    const rentabilidade = totalInvested > 0
      ? (((income - expense) / totalInvested) * 100).toFixed(1)
      : '0.0';

    return (
      <div
        ref={ref}
        style={{
          width: 420,
          padding: 28,
          background: 'linear-gradient(145deg, #0f1729 0%, #162033 50%, #0d1520 100%)',
          color: '#e2e8f0',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          borderRadius: 16,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 120, height: 120,
          borderRadius: '50%', background: 'rgba(52, 211, 153, 0.06)',
        }} />
        <div style={{
          position: 'absolute', bottom: -30, left: -30, width: 100, height: 100,
          borderRadius: '50%', background: 'rgba(96, 165, 250, 0.05)',
        }} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20, position: 'relative' }}>
          <p style={{ fontSize: 11, color: '#94a3b8', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
            Resumo Financeiro
          </p>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#f1f5f9' }}>
            {formatMonthYear(month)}
          </h2>
        </div>

        {/* Balance Hero */}
        <div style={{
          textAlign: 'center', padding: '16px 0', marginBottom: 16, borderRadius: 12,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Saldo Atual</p>
          <p style={{
            fontSize: 28, fontWeight: 800, margin: 0,
            color: currentBalance >= 0 ? '#34d399' : '#f87171', letterSpacing: -1,
          }}>
            {formatCurrency(currentBalance)}
          </p>
        </div>

        {/* Income / Expense / Invested Cards */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          <div style={{
            flex: 1, padding: '10px 12px', borderRadius: 10,
            background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
              <TrendingUp size={12} color="#34d399" />
              <span style={{ fontSize: 9, color: '#94a3b8' }}>Receitas</span>
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: '#34d399' }}>
              {formatCurrency(income)}
            </p>
          </div>
          <div style={{
            flex: 1, padding: '10px 12px', borderRadius: 10,
            background: 'rgba(248, 113, 113, 0.08)', border: '1px solid rgba(248, 113, 113, 0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
              <TrendingDown size={12} color="#f87171" />
              <span style={{ fontSize: 9, color: '#94a3b8' }}>Despesas</span>
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: '#f87171' }}>
              {formatCurrency(expense)}
            </p>
          </div>
          <div style={{
            flex: 1, padding: '10px 12px', borderRadius: 10,
            background: 'rgba(96, 165, 250, 0.08)', border: '1px solid rgba(96, 165, 250, 0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
              <Landmark size={12} color="#60a5fa" />
              <span style={{ fontSize: 9, color: '#94a3b8' }}>Investido</span>
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: '#60a5fa' }}>
              {formatCurrency(totalInvested)}
            </p>
          </div>
        </div>

        {/* Bar Chart */}
        <div style={{
          marginBottom: 18, padding: 14, borderRadius: 12,
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10, fontWeight: 600 }}>
            Receitas vs Despesas
          </p>
          <div style={{ width: '100%', height: 100 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={65} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
                  {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart - Categories */}
        {pieData.length > 0 && (
          <div style={{
            padding: 14, borderRadius: 12,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            marginBottom: 18,
          }}>
            <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, fontWeight: 600 }}>
              Despesas por Categoria
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 140, height: 140, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={65} innerRadius={28} dataKey="value" labelLine={false} label={renderCustomLabel} strokeWidth={1} stroke="rgba(15,23,41,0.6)">
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, minWidth: 0 }}>
                {pieData.map((cat) => (
                  <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, flexShrink: 0, backgroundColor: cat.color }} />
                    <span style={{ fontSize: 10, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {cat.name}
                    </span>
                    <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, flexShrink: 0 }}>
                      {formatCurrency(cat.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Transactions List */}
        {transactionList.length > 0 && (
          <div style={{
            padding: 14, borderRadius: 12,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            marginBottom: 18,
          }}>
            <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10, fontWeight: 600 }}>
              Extrato do Mês ({transactionList.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {transactionList.slice(0, 20).map((tx, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  paddingBottom: 5,
                  borderBottom: i < Math.min(transactionList.length, 20) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minWidth: 0 }}>
                    <span style={{
                      fontSize: 10, color: '#cbd5e1',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {tx.description}
                    </span>
                    <span style={{ fontSize: 9, color: '#64748b' }}>
                      {formatDateBR(tx.date)}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, flexShrink: 0, marginLeft: 8,
                    color: tx.type === 'income' ? '#34d399' : '#f87171',
                  }}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
              {transactionList.length > 20 && (
                <p style={{ fontSize: 9, color: '#64748b', textAlign: 'center', marginTop: 4 }}>
                  +{transactionList.length - 20} transações
                </p>
              )}
            </div>
          </div>
        )}

        {/* Coverage info */}
        {futureCoverage > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 14px', borderRadius: 10, marginBottom: 16,
            background: 'rgba(96, 165, 250, 0.08)', border: '1px solid rgba(96, 165, 250, 0.15)',
          }}>
            <Shield size={14} color="#60a5fa" />
            <span style={{ fontSize: 10, color: '#94a3b8' }}>
              {formatCurrency(futureCoverage)} coberto por investimentos
            </span>
          </div>
        )}

        {/* Footer */}
        <div style={{
          textAlign: 'center', paddingTop: 8,
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <p style={{ fontSize: 9, color: '#475569', margin: 0 }}>
            FinançasPRO • Gerado em {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>
    );
  }
);

FinancialSummaryPDF.displayName = 'FinancialSummaryPDF';
