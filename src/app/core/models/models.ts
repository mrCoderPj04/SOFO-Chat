export enum UserStatus {
  ONLINE = 'ONLINE',
  AWAY = 'AWAY',
  BUSY = 'BUSY',
  DND = 'DND',
  OFFLINE = 'OFFLINE'
}

export enum Role {
  ROLE_EMPLOYEE = 'ROLE_EMPLOYEE',
  ROLE_ADMIN = 'ROLE_ADMIN',
  ROLE_MANAGER = 'ROLE_MANAGER',
  ROLE_MODERATOR = 'ROLE_MODERATOR'
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  emsCode?: string;
}

export interface UserSummary {
  id: string;
  employeeId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  designation: string;
  avatarUrl: string;
  status: UserStatus;
  customStatusMessage?: string;
  phone?: string;
  lastSeen?: string;
  departmentId?: string;
  departmentName?: string;
  role: Role;
  isEmsAuthorized: boolean;
}

export interface UserProfile extends UserSummary {
  phone?: string;
  about?: string;
  isEmsSynced?: boolean;
  department?: Department;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: UserProfile;
  emsStatus: string;
}

export enum ConversationType {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP'
}

export interface ConversationMember {
  id: string;
  user: UserSummary;
  unreadCount: number;
  lastReadAt?: string;
  isMuted: boolean;
  joinedAt: string;
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  AUDIO = 'AUDIO',
  SYSTEM = 'SYSTEM',
  MEETING_INVITE = 'MEETING_INVITE'
}

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ'
}

export interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  thumbnailUrl?: string;
  createdAt: string;
}

export interface MessageReaction {
  id: string;
  emoji: string;
  user: UserSummary;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: UserSummary;
  content: string;
  type: MessageType;
  status: MessageStatus;
  replyTo?: Message;
  isEdited: boolean;
  isDeleted: boolean;
  attachments: Attachment[];
  reactions: MessageReaction[];
  createdAt: string;
  updatedAt?: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  title: string;
  avatarUrl?: string;
  groupId?: string;
  members: ConversationMember[];
  lastMessage?: Message;
  unreadCount: number;
  lastActivityAt: string;
  otherUser?: UserSummary;
}

export enum GroupRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER'
}

export interface GroupMember {
  id: string;
  user: UserSummary;
  role: GroupRole;
  joinedAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  createdBy: UserSummary;
  departmentId?: string;
  departmentName?: string;
  conversationId?: string;
  memberCount: number;
  members: GroupMember[];
  createdAt: string;
  updatedAt?: string;
}

export enum MeetingType {
  INSTANT = 'INSTANT',
  SCHEDULED = 'SCHEDULED'
}

export enum MeetingStatus {
  WAITING = 'WAITING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface MeetingParticipant {
  id: string;
  user: UserSummary;
  isHost: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  joinedAt?: string;
  leftAt?: string;
}

export interface MeetingMessage {
  id: string;
  meetingId: string;
  sender: UserSummary;
  message: string;
  createdAt: string;
}

export interface Meeting {
  id: string;
  meetingCode: string;
  title: string;
  description?: string;
  type: MeetingType;
  status: MeetingStatus;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  durationMinutes: number;
  host: UserSummary;
  groupId?: string;
  groupName?: string;
  agenda?: string;
  passCode?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  participants: MeetingParticipant[];
  participantCount: number;
  createdAt: string;
}

export enum NotificationType {
  MESSAGE = 'MESSAGE',
  MEETING_INVITATION = 'MEETING_INVITATION',
  MEETING_STARTING = 'MEETING_STARTING',
  MEETING_STARTED = 'MEETING_STARTED',
  GROUP_ADDED = 'GROUP_ADDED',
  MENTION = 'MENTION',
  FILE_RECEIVED = 'FILE_RECEIVED'
}

export interface Notification {
  id: string;
  sender?: UserSummary;
  type: NotificationType;
  title: string;
  body: string;
  actionUrl?: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}
