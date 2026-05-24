'use client';

import type { ReactNode } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardData } from '@/services/saas-dashboard-service';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const number = new Intl.NumberFormat('pt-BR');

const pieColors = ['#22c55e', '#facc15', '#ef4444', '#64748b'];

function ChartFrame({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] min-w-0">{children}</div>
      </CardContent>
    </Card>
  );
}

function axisStyle() {
  return { fill: 'var(--dash-muted)', fontSize: 11, fontWeight: 700 };
}

function tooltipStyle() {
  return {
    background: 'var(--dash-surface-strong)',
    border: '1px solid var(--dash-border)',
    borderRadius: 8,
    color: 'var(--dash-fg)',
  };
}

export function RevenueChart({ data, className }: { data: DashboardData['monthlyRevenue']; className?: string }) {
  return (
    <ChartFrame title="Receita mensal" description="Evolução do faturamento consolidado." className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 6, top: 12, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#facc15" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--dash-border)" vertical={false} />
          <XAxis dataKey="name" tick={axisStyle()} axisLine={false} tickLine={false} />
          <YAxis tick={axisStyle()} axisLine={false} tickLine={false} tickFormatter={(value) => currency.format(Number(value)).replace('R$', 'R$ ')} />
          <Tooltip
            contentStyle={tooltipStyle()}
            formatter={(value) => [currency.format(Number(value)), 'Receita']}
            labelStyle={{ color: 'var(--dash-fg)' }}
          />
          <Area type="monotone" dataKey="receita" stroke="#facc15" strokeWidth={3} fill="url(#revenueGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function ClientGrowthChart({ data, className }: { data: DashboardData['clientGrowth']; className?: string }) {
  return (
    <ChartFrame title="Crescimento de clientes" description="Base ativa por ciclo mensal." className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 0, right: 8, top: 12, bottom: 0 }}>
          <CartesianGrid stroke="var(--dash-border)" vertical={false} />
          <XAxis dataKey="name" tick={axisStyle()} axisLine={false} tickLine={false} />
          <YAxis tick={axisStyle()} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle()} formatter={(value) => [number.format(Number(value)), 'Clientes']} />
          <Line type="monotone" dataKey="clientes" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function PaymentStatusChart({ data, className }: { data: DashboardData['paymentStatus']; className?: string }) {
  return (
    <ChartFrame title="Pagamentos por status" description="Distribuição da carteira de cobrança." className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={68} outerRadius={104} paddingAngle={4}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle()} formatter={(value) => [number.format(Number(value)), 'Faturas']} />
          <Legend iconType="circle" wrapperStyle={{ color: 'var(--dash-muted)', fontSize: 12, fontWeight: 700 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function PixVsBoletoChart({ data, className }: { data: DashboardData['pixVsBoleto']; className?: string }) {
  return (
    <ChartFrame title="Pix vs boleto" description="Recebimento por trilha de pagamento." className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 8, top: 12, bottom: 0 }}>
          <CartesianGrid stroke="var(--dash-border)" vertical={false} />
          <XAxis dataKey="name" tick={axisStyle()} axisLine={false} tickLine={false} />
          <YAxis tick={axisStyle()} axisLine={false} tickLine={false} tickFormatter={(value) => currency.format(Number(value)).replace('R$', 'R$ ')} />
          <Tooltip contentStyle={tooltipStyle()} formatter={(value, name) => [currency.format(Number(value)), name === 'pix' ? 'Pix' : 'Boleto']} />
          <Legend wrapperStyle={{ color: 'var(--dash-muted)', fontSize: 12, fontWeight: 700 }} />
          <Bar dataKey="pix" stackId="payments" fill="#22c55e" radius={[6, 6, 0, 0]} />
          <Bar dataKey="boleto" stackId="payments" fill="#facc15" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function EnergySavingsChart({ data, className }: { data: DashboardData['energySavings']; className?: string }) {
  return (
    <ChartFrame title="Economia de energia" description="Economia financeira e kWh compensados." className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 8, top: 12, bottom: 0 }}>
          <defs>
            <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--dash-border)" vertical={false} />
          <XAxis dataKey="name" tick={axisStyle()} axisLine={false} tickLine={false} />
          <YAxis tick={axisStyle()} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={tooltipStyle()}
            formatter={(value, name) => [
              name === 'economia' ? currency.format(Number(value)) : `${number.format(Number(value))} kWh`,
              name === 'economia' ? 'Economia' : 'kWh',
            ]}
          />
          <Area type="monotone" dataKey="economia" stroke="#22c55e" strokeWidth={3} fill="url(#energyGradient)" />
          <Line type="monotone" dataKey="kwh" stroke="#38bdf8" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function DashboardCharts({ data }: { data: DashboardData }) {
  return (
    <div className="grid gap-4 xl:grid-cols-6">
      <RevenueChart data={data.monthlyRevenue} className="xl:col-span-3" />
      <ClientGrowthChart data={data.clientGrowth} className="xl:col-span-3" />
      <PaymentStatusChart data={data.paymentStatus} className="xl:col-span-2" />
      <PixVsBoletoChart data={data.pixVsBoleto} className="xl:col-span-2" />
      <EnergySavingsChart data={data.energySavings} className="xl:col-span-2" />
    </div>
  );
}
