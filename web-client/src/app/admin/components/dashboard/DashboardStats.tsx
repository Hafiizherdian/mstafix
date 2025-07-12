import { Users, FileQuestion, Activity, Clock, RefreshCw, ArrowUp, ArrowDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { Skeleton } from '@/app/admin/components/ui/skeleton';
import { Button } from '@/app/admin/components/ui/Button';
import { AnalyticsData } from '../../types';
import { formatNumber } from '@/app/admin/lib/utils';
import { logger } from '@/lib/logger';
import { useEffect, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const componentLogger = logger.child({ component: 'DashboardStats' });

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Terjadi kesalahan yang tidak diketahui';
};

type TrendType = 'increase' | 'decrease' | 'neutral';

interface TrendData {
  value: string;
  label: string;
  type: TrendType;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description: string;
  trend?: TrendData;
  loading?: boolean;
}


const StatCard = ({ title, value, icon: Icon, description, trend, loading = false }: StatCardProps) => {
  if (loading) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 h-full flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
        <div>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full" />
          {trend && <Skeleton className="h-3 w-1/2 mt-3" />}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 transform hover:-translate-y-1 transition-all duration-300 group hover:border-cyan-800/80 hover:shadow-2xl hover:shadow-cyan-900/20 flex flex-col h-full"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">{title}</h3>
        <div className="h-10 w-10 bg-cyan-900/30 rounded-lg flex items-center justify-center border border-cyan-800/50 group-hover:bg-cyan-900/50 transition-colors">
          <Icon className="h-5 w-5 text-cyan-400" />
        </div>
      </div>
      <div className="flex-grow flex flex-col justify-end">
        <div className="text-3xl font-bold text-white mb-1">{value}</div>
        <p className="text-xs text-zinc-400 line-clamp-2 min-h-[2.5rem]">{description}</p>
        {trend && (
          <div
            className={cn('mt-2 flex items-center text-xs font-medium', {
              'text-green-500': trend.type === 'increase',
              'text-red-500': trend.type === 'decrease',
              'text-amber-500': trend.type === 'neutral',
            })}
          >
            {trend.type === 'increase' && <ArrowUp className="h-3 w-3 mr-1 flex-shrink-0" />}
            {trend.type === 'decrease' && <ArrowDown className="h-3 w-3 mr-1 flex-shrink-0" />}
            {trend.type === 'neutral' && <span className="mr-1">•</span>}
            <span>{trend.value} {trend.label}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

interface DashboardStatsProps {
  data: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function DashboardStats({ data, loading, error, refetch }: DashboardStatsProps) {
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    if (data) componentLogger.info('Analytics data loaded');
    if (error) componentLogger.error('Error loading analytics', { error: getErrorMessage(error) });
  }, [data, error]);

  useEffect(() => {
    if (!loading && data) {
      setLastUpdated(new Date());
    }
  }, [loading, data]);

  const handleRefresh = useCallback(() => {
    componentLogger.info('Manual refresh triggered');
    refetch();
  }, [refetch]);

  const getTrendType = (value?: number): TrendType => {
    if (value === undefined || value === 0) return 'neutral';
    return value > 0 ? 'increase' : 'decrease';
  };

  const stats: Omit<StatCardProps, 'loading'>[] = [
    {
      title: 'Total Pengguna',
      value: formatNumber(data?.userStats?.total || 0),
      icon: Users,
      description: `${formatNumber(data?.userStats?.new || 0)} pengguna aktif.`,
      trend: {
        value: formatNumber(parseFloat(data?.userStats?.growth?.percentage || '0')),
        label: 'pertumbuhan',
        type: getTrendType(parseFloat(data?.userStats?.growth?.percentage || '0')),
      },
    },
    {
      title: 'Total Soal',
      value: formatNumber(data?.questionStats?.total || 0),
      icon: FileQuestion,
      description: data?.questionStats?.recent?.[0]?.createdAt
        ? `Terakhir ditambah: ${formatDistanceToNow(new Date(data.questionStats.recent[0].createdAt), { addSuffix: true, locale: id })}`
        : 'Belum ada soal yang ditambahkan.',
      trend: {
        value: 'N/A',
        label: '',
        type: 'neutral',
      },
    },
    {
      title: 'Status Sistem',
      value: 'Online',
      icon: Clock,
      description: 'Semua layanan berjalan normal.',
      trend: {
        value: 'Sehat',
        label: '',
        type: 'increase',
      },
    },
  ];

  if (error) {
    return (
      <div className="grid gap-4">
        <Card className="col-span-full bg-destructive/10 border-destructive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-destructive">Gagal Memuat Data</h3>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive-foreground">{getErrorMessage(error)}</p>
            <Button variant="destructive" size="sm" onClick={handleRefresh} className="mt-4">
              <RefreshCw className="mr-2 h-4 w-4" /> Coba Lagi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2 sm:px-0">
        <div>
          <h2 className="text-base sm:text-lg font-semibold">Ringkasan Dashboard</h2>
          <p className="text-xs text-muted-foreground">
            Statistik dan aktivitas terbaru
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1 sm:mt-0">
          <AnimatePresence mode="wait">
            {!loading && data && (
              <motion.div 
                key="last-updated"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="hidden xs:flex items-center text-[11px] xs:text-xs text-muted-foreground whitespace-nowrap"
              >
                <CheckCircle2 className="h-3 w-3 mr-1 text-green-500 flex-shrink-0" />
                <span>Diperbarui {formatDistanceToNow(lastUpdated, { addSuffix: true, locale: id })}</span>
              </motion.div>
            )}
          </AnimatePresence>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loading}
            className="shrink-0 h-8 sm:h-9 text-xs sm:text-sm"
          >
            <RefreshCw className={`mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Memperbarui...' : 'Perbarui'}
          </Button>
        </div>
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div 
          key={loading ? 'loading' : 'loaded'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={loading ? '...' : stat.value}
              icon={stat.icon}
              description={stat.description}
              trend={stat.trend}
              loading={loading}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
