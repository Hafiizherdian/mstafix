import { Activity, Clock, User, FileQuestion, Users, RefreshCw, ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/app/admin/components/ui/Button';
import { Badge } from '@/app/admin/components/ui/badge';
import { Skeleton } from '@/app/admin/components/ui/skeleton';
import { formatDistanceToNow, format } from 'date-fns';
import { id } from 'date-fns/locale';
import { logger } from '@/lib/logger';
import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { api } from '../../services/api';

// Create a logger instance for this component
const componentLogger = logger.child({ component: 'RecentActivity' });

type ActivityType = 'question_created' | 'user_registered' | 'generation_completed' | 'login';

interface ActivityUser {
  name: string;
  email: string;
  avatar?: string;
}

// Definisikan tipe yang lebih spesifik untuk metadata activity
type ActivityMetadataValue = string | number | boolean | null | undefined;

// Definisikan tipe untuk properti yang diketahui
type KnownActivityMetadata = {
  count?: number;
  category?: string;
  questionId?: string;
  generationId?: string;
  ip?: string;
  device?: string;
  action?: string;
  [key: `_${string}`]: ActivityMetadataValue; // Untuk properti dinamis tambahan
};

// Gunakan tipe ini untuk metadata
type ActivityMetadata = KnownActivityMetadata;

interface ActivityItem {
  id: string;
  type: ActivityType;
  user: ActivityUser;
  metadata?: ActivityMetadata;
  timestamp: string;
}

const activityTypes: Record<ActivityType, {
  icon: React.ElementType;
  text: string;
  color: string;
  bgColor: string;
  iconBgColor: string;
}> = {
  question_created: {
    icon: FileQuestion,
    text: 'membuat soal baru',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 hover:bg-blue-500/20',
    iconBgColor: 'bg-blue-500/20',
  },
  user_registered: {
    icon: User,
    text: 'bergabung',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    iconBgColor: 'bg-emerald-500/20',
  },
  generation_completed: {
    icon: Activity,
    text: 'menyelesaikan generasi soal',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 hover:bg-purple-500/20',
    iconBgColor: 'bg-purple-500/20',
  },
  login: {
    icon: Users,
    text: 'masuk ke sistem',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 hover:bg-amber-500/20',
    iconBgColor: 'bg-amber-500/20',
  },
};

interface ApiActivityResponse {
  id: string;
  type: ActivityType;
  user: ActivityUser;
  metadata?: ActivityMetadata;
  createdAt: string;
}

interface ApiResponse {
  success: boolean;
  data: ApiActivityResponse[];
  error?: string;
}

export function RecentActivity(): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Format activity timestamp
  const formatActivityTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { 
        addSuffix: true, 
        locale: id 
      });
    } catch (e) {
      return 'baru saja';
    }
  };

  // Fetch activities from API
  const fetchActivities = useCallback(async () => {
    const logContext = { component: 'RecentActivity', action: 'fetchActivities' };
    
    try {
      setIsLoading(true);
      componentLogger.info('Fetching activities', logContext);
      
      // Panggil endpoint menggunakan instance API yang sudah dikonfigurasi untuk menyertakan token
      const result = await api.get('/v1/notifications/activities/recent?limit=10') as ApiResponse;
      
      if (!result.success) {
        throw new Error(result.error || 'Gagal memuat aktivitas');
      }
      
      // Transform data dari format endpoint ke format yang diharapkan komponen
      const transformedData = result.data.map((activity: ApiActivityResponse) => ({
        id: activity.id,
        type: activity.type,
        user: activity.user,
        metadata: activity.metadata || {},
        timestamp: activity.createdAt
      }));
      
      setActivities(transformedData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal memuat aktivitas';
      componentLogger.error('Error fetching activities:', { error: errorMessage });
      setError(errorMessage);
      
      // Fallback ke data mock jika terjadi error
      if (activities.length === 0) {
        setActivities(getMockActivities());
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activities.length]);

  // Fungsi untuk mendapatkan data mock
  const getMockActivities = (): ActivityItem[] => {
    return [
      {
        id: '1',
        type: 'question_created',
        user: {
          name: 'Admin',
          email: 'admin@example.com',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
        },
        metadata: {
          count: 5,
          category: 'Matematika',
          questionId: 'q123'
        },
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        type: 'user_registered',
        user: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
        },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '3',
        type: 'generation_completed',
        user: {
          name: 'System',
          email: 'system@example.com',
        },
        metadata: {
          count: 20,
          category: 'Bahasa Indonesia',
          generationId: 'gen456'
        },
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '4',
        type: 'login',
        user: {
          name: 'Admin',
          email: 'admin@example.com',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
        },
        metadata: {
          ip: '192.168.1.1',
          device: 'Chrome on Windows'
        },
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  };

  // Load activities on component mount
  useEffect(() => {
    fetchActivities();
    
    // Refresh data setiap 30 detik
    const intervalId = setInterval(fetchActivities, 30000);
    
    return () => clearInterval(intervalId);
  }, [fetchActivities]);

  // Handle refresh button click
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchActivities().catch(err => {
      componentLogger.error('Error during refresh:', err);
      setIsRefreshing(false);
    });
  };

  // Handle view all activities
  const handleViewAll = () => {
    componentLogger.info('View all activities clicked', {
      action: 'view_all_activities',
      currentActivityCount: activities.length
    });
    // Navigate to full activity log
    // router.push('/admin/activities');
  };
  
  // Handle activity item click
  const handleActivityClick = (activity: ActivityItem) => {
    componentLogger.info('Activity item clicked', {
      activityId: activity.id,
      activityType: activity.type,
      userId: activity.user.email,
      timestamp: activity.timestamp
    });
    
    // Handle different activity types
    switch (activity.type) {
      case 'question_created':
        // router.push(`/admin/questions/${activity.metadata?.questionId}`);
        break;
      case 'user_registered':
        // router.push(`/admin/users/${activity.user.email}`);
        break;
      case 'generation_completed':
        // router.push(`/admin/generations/${activity.metadata?.generationId}`);
        break;
      case 'login':
        // Show login details modal
        break;
    }
  };
  
  // Get activity description based on type
  const getActivityDescription = (activity: ActivityItem) => {
    const { type, metadata, user } = activity;
    const activityType = activityTypes[type];
    
    // Default values to avoid undefined in template literals
    const count = metadata?.count ?? 0;
    const category = metadata?.category ?? '';
    
    switch (type) {
      case 'question_created':
        return `${user.name} ${activityType.text} (${count} soal ${category})`;
      case 'generation_completed':
        return `${user.name} ${activityType.text} (${count} soal ${category})`;
      case 'user_registered':
        return `${user.name} ${activityType.text} ke sistem`;
      case 'login':
        return `${user.name} ${activityType.text}`;
      default:
        return `${user.name} melakukan aktivitas`;
    }
  };

  // Loading state
  if (isLoading && activities.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <Card className="border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm flex-1">
          <CardHeader className="p-4 sm:p-6 pb-3 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" />
                <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Aktivitas Terbaru</span>
              </CardTitle>
              <Button variant="ghost" size="sm" disabled className="text-zinc-400 hover:text-zinc-300">
                <RefreshCw className="h-4 w-4 animate-spin" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-9 w-9 rounded-lg bg-zinc-800" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48 bg-zinc-800" />
                  <Skeleton className="h-3 w-32 bg-zinc-800" />
                </div>
                <Skeleton className="h-4 w-12 bg-zinc-800" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error && activities.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <Card className="border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm flex-1">
          <CardHeader className="p-4 sm:p-6 pb-3 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-rose-500" />
                <span className="bg-gradient-to-r from-rose-400 to-pink-500 bg-clip-text text-transparent">Aktivitas Terbaru</span>
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="text-zinc-400 hover:text-zinc-300"
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <div className="text-rose-400 mb-4 text-sm">
              {error}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-sm border-zinc-700 text-zinc-300 hover:bg-zinc-800/50 hover:text-white"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memuat...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Coba Lagi
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main content
  return (
    <div className="h-full flex flex-col">
      <Card className="border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm flex-1">
        <CardHeader className="p-4 sm:p-6 pb-3 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Aktivitas Terbaru</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="hidden sm:flex items-center text-xs border-zinc-700 hover:bg-zinc-800/50 text-zinc-300 hover:text-white transition-colors"
                onClick={handleViewAll}
              >
                Lihat Semua
                <ArrowRight className="ml-1 h-3.5 w-3.5 text-zinc-400" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0 flex items-center justify-center border-zinc-700 hover:bg-zinc-800/50 text-zinc-300 hover:text-white transition-colors"
                onClick={handleRefresh}
                disabled={isRefreshing}
                title="Muat Ulang"
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-zinc-800">
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center text-zinc-500">
                <Activity className="h-10 w-10 sm:h-12 sm:w-12 opacity-20 mb-2" />
                <p className="font-medium text-sm sm:text-base">Belum ada aktivitas</p>
                <p className="text-xs sm:text-sm">Aktivitas terbaru akan muncul di sini</p>
              </div>
            ) : (
              activities.map((activity) => {
                const activityType = activityTypes[activity.type];
                const ActivityIcon = activityType.icon;
                
                return (
                  <div 
                    key={activity.id}
                    className={`group flex items-start p-3 sm:p-4 ${activityType.bgColor} transition-colors cursor-pointer`}
                    onClick={() => handleActivityClick(activity)}
                  >
                    <div className={`flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-lg ${activityType.iconBgColor} ${activityType.color} transition-colors`}>
                      <ActivityIcon className="h-4 w-4 sm:h-4 sm:w-4" />
                    </div>
                    <div className="flex-1 min-w-0 ml-3">
                      <p className="text-sm font-medium text-white leading-tight line-clamp-2 sm:line-clamp-1 group-hover:text-cyan-300 transition-colors">
                        {getActivityDescription(activity)}
                      </p>
                      <div className="flex items-center mt-1.5 flex-wrap gap-1.5 sm:gap-2">
                        <span className="inline-flex items-center text-xs text-zinc-400">
                          <Clock className="h-3 w-3 mr-1.5 flex-shrink-0 text-zinc-500" />
                          <span>{formatActivityTime(activity.timestamp)}</span>
                        </span>
                        {activity.metadata?.category && (
                          <span className="text-xs px-1.5 py-0.5 bg-zinc-800/50 text-zinc-300 rounded-md border border-zinc-700 whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] sm:max-w-none">
                            {activity.metadata.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-zinc-500 self-center flex-shrink-0 ml-2 sm:ml-4 whitespace-nowrap group-hover:text-zinc-300 transition-colors">
                      {format(new Date(activity.timestamp), 'HH:mm')}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
        {lastUpdated && activities.length > 0 && (
          <div className="border-t border-zinc-800 px-4 sm:px-6 py-2 bg-zinc-900/30">
            <p className="text-xs text-zinc-500 text-center sm:text-left">
              Diperbarui {formatDistanceToNow(new Date(lastUpdated.getTime()), { 
                addSuffix: true, 
                locale: id 
              })}
            </p>
          </div>
        )}
      </Card>
      {/* Mobile View All Button */}
      <div className="sm:hidden mt-3">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full h-10 text-xs border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
          onClick={handleViewAll}
        >
          Lihat Semua Aktivitas
          <ArrowRight className="ml-2 h-3.5 w-3.5 text-zinc-400 group-hover:text-white transition-colors" />
        </Button>
      </div>
    </div>
  );
}
