interface Activity {
  id: string;
  type: string;
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  metadata?: Record<string, any>;
  timestamp: string;
  message: string;
}

// In-memory storage for activities
const activities: Activity[] = [];
const MAX_ACTIVITIES = 100;

/**
 * Add a new activity to the store
 */
export function addActivity(activity: Omit<Activity, 'id' | 'timestamp' | 'message'>): void {
  const newActivity: Activity = {
    ...activity,
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    message: generateActivityMessage(activity)
  };

  // Add to beginning of array (newest first)
  activities.unshift(newActivity);

  // Remove oldest activity if we've reached the limit
  if (activities.length > MAX_ACTIVITIES) {
    activities.pop();
  }
}

/**
 * Get recent activities
 */
export function getRecentActivities(limit: number = 10): Activity[] {
  return activities.slice(0, limit);
}

/**
 * Generate a human-readable activity message
 */
function generateActivityMessage(activity: Omit<Activity, 'id' | 'timestamp' | 'message'>): string {
  const { type, user, metadata } = activity;
  const userName = user?.name || 'Seseorang';

  switch (type) {
    case 'question_created':
      return `${userName} membuat soal baru (${metadata?.count || 1} soal ${metadata?.category || ''})`;
    case 'user_registered':
      return `${userName} bergabung ke sistem`;
    case 'generation_completed':
      return `Admin menyelesaikan generasi soal (${metadata?.count || 1} soal ${metadata?.category || ''})`;
    case 'login':
      return `${userName} masuk ke sistem`;
    default:
      return `Aktivitas baru: ${type}`;
  }
}
