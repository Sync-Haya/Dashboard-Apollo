import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface TimelineChartProps {
  data: any[];
  title: string;
  isApollo?: boolean;
}

export function TimelineChart({ data, title, isApollo }: TimelineChartProps) {
  return (
    <div className="flex flex-col h-full bg-card/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-white/5 bg-white/5">
        <h3 className="text-base xl:text-lg font-display font-bold tracking-tight text-white">{title}</h3>
      </div>
      <div className="flex-1 p-4 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
            <XAxis 
              dataKey="hora" 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                fontSize: '12px',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              }}
              cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle"
              wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingBottom: '20px' }} 
            />
            <Line 
              type="monotone" 
              dataKey="abertos" 
              name="Pendentes (Abertos Agora)" 
              stroke="#f97316" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#f97316', strokeWidth: 2, stroke: 'hsl(var(--background))' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              animationDuration={1500}
            />
            <Line 
              type="monotone" 
              dataKey="finalizados" 
              name="Finalizados no Horário" 
              stroke="#10b981" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: 'hsl(var(--background))' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
