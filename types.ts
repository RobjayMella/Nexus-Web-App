
export enum TaskType {
  BAU = 'BAU',
  ADHOC = 'Ad-hoc'
}

export enum TaskFrequency {
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  BIWEEKLY = 'Bi-Weekly',
  MONTHLY = 'Monthly',
  QUARTERLY = 'Quarterly'
}

export enum TaskStatus {
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  REVIEW = 'In Review',
  DONE = 'Done'
}

export enum TaskPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export enum LeaveType {
  VACATION = 'Vacation',
  SICK = 'Sick Leave',
  PERSONAL = 'Personal',
  OTHER = 'Other'
}

export interface User {
  id: string;
  name: string;
  email: string; // Added email field
  role: string;
  avatar?: string; // Base64 string
  themePreference: 'light' | 'dark' | 'system';
}

export interface FileRepositoryItem {
  id: string;
  name: string;
  url: string; // Could be a real URL or a base64 string for local uploads in this demo
  type: 'Link' | 'Document' | 'Image' | 'Dashboard' | 'Report';
  uploadedBy: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  creatorId: string;
  dueDate: string; // ISO Date string
  dueTime?: string; // HH:mm string
  frequency?: TaskFrequency; // For BAU e.g., "Weekly", "Daily"
  createdAt: string;
  fileIds?: string[]; // IDs of attached FileRepositoryItems
}

export interface LeaveRecord {
  id: string;
  userId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  type: LeaveType;
  reason: string;
  status: 'Approved' | 'Pending'; // Simplified for this demo
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
  entityId?: string;
  entityType?: 'Task' | 'User' | 'System' | 'File' | 'Leave';
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  timestamp: string;
}

export interface AppState {
  users: User[];
  currentUser: User | null;
  tasks: Task[];
  logs: ActivityLog[];
  notifications: Notification[];
  files: FileRepositoryItem[];
  leaves: LeaveRecord[];
}
