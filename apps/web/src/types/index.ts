// TypeScript types matching backend entities

export enum UserRole {
  ADMIN = 'admin',
  OPERATOR = 'operator',
}

export enum ParticipantStatus {
  PRE_REGISTERED = 'pre_registered',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  WAIVED = 'waived',
}

export enum ActivityStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  CLOSED = 'closed',
}

export enum AttendanceType {
  GENERAL = 'general',
  ACTIVITY = 'activity',
}

export enum DeliveryType {
  MATERIALS = 'materials',
  SNACK = 'snack',
  KIT = 'kit',
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Participant {
  id: string;
  registrationCode: string;
  firstName: string;
  lastName: string;
  badgeName?: string | null;
  documentNumber?: string | null;
  country: string;
  district?: string | null;
  club?: string | null;
  roleTitle?: string | null;
  email: string;
  phone?: string | null;
  participantType: string;
  specialRequirements?: string | null;
  notes?: string | null;
  qrCode: string;
  status: ParticipantStatus;
  lionNumber?: string | null;
  photoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  participant: Participant;
  participantId: string;
  concept: string;
  expectedAmount: number;
  paidAmount: number;
  balance: number;
  status: PaymentStatus;
  voucherFile?: string | null;
  reviewedBy?: User | null;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  name: string;
  description?: string | null;
  date: string;
  startTime: string;
  endTime?: string | null;
  location: string;
  capacity?: number | null;
  activityType: string;
  status: ActivityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  participantId: string;
  participant?: Participant;
  activityId?: string | null;
  activity?: Activity | null;
  attendanceType: AttendanceType;
  scannedBy: string;
  scannedAt: string;
}

export interface DeliveryRecord {
  id: string;
  participantId: string;
  participant?: Participant;
  deliveryType: DeliveryType;
  scannedBy: string;
  deliveredAt: string;
  notes?: string | null;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  fullName: string;
}

export interface LoginResponse {
  accessToken: string;
  user: JwtPayload;
}

export interface AccountStatus {
  participantId: string;
  totalExpected: number;
  totalPaid: number;
  balance: number;
  status: PaymentStatus;
  payments: Payment[];
}

// DTOs for creating/updating
export interface CreateParticipantDto {
  firstName: string;
  lastName: string;
  badgeName?: string;
  documentNumber?: string;
  country: string;
  district?: string;
  club?: string;
  roleTitle?: string;
  email: string;
  phone?: string;
  participantType: string;
  specialRequirements?: string;
  notes?: string;
  status?: ParticipantStatus;
  lionNumber?: string;
  photoUrl?: string;
}

export interface CreatePaymentDto {
  participantId: string;
  concept: string;
  expectedAmount: number;
  paidAmount?: number;
  notes?: string;
}

export interface ReviewPaymentDto {
  status: PaymentStatus;
  notes?: string;
}

export interface CreateActivityDto {
  name: string;
  description?: string;
  date: string;
  startTime: string;
  endTime?: string;
  location: string;
  capacity?: number;
  activityType: string;
  status?: ActivityStatus;
}

export interface CreateUserDto {
  fullName: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUserDto {
  fullName?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface ScanResponse {
  success: boolean;
  message: string;
  participant?: Participant;
  warning?: string;
}

export interface DashboardStats {
  totalParticipants: number;
  paidParticipants: number;
  pendingParticipants: number;
  totalAttendance: number;
  totalMaterials: number;
  totalSnacks: number;
}

export interface ReportFilters {
  country?: string;
  district?: string;
  club?: string;
  participantType?: string;
  status?: string;
  paymentStatus?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
}

export interface ReportSummary {
  total: number;
  byStatus?: Record<string, number>;
  byCountry?: Record<string, number>;
  byType?: Record<string, number>;
}

export interface ParticipantsReportResponse {
  total: number;
  summary: {
    total: number;
    byStatus: Record<string, number>;
    byCountry: Record<string, number>;
    byType: Record<string, number>;
  };
  items: Participant[];
}

export interface PaymentsReportResponse {
  total: number;
  totalExpected: number;
  totalPaid: number;
  totalBalance: number;
  summary: {
    total: number;
    byStatus: Record<string, number>;
  };
  items: Payment[];
}

export interface AttendanceReportResponse {
  total: number;
  summary: {
    total: number;
    byType: Record<string, number>;
    byActivity: Record<string, number>;
  };
  items: AttendanceRecord[];
}

export interface DeliveriesReportResponse {
  total: number;
  summary: {
    total: number;
    byType: Record<string, number>;
  };
  items: DeliveryRecord[];
}

export interface DashboardReportResponse {
  totalParticipants: number;
  participantsByStatus: Record<string, number>;
  participantsByCountry: Record<string, number>;
  participantsByType: Record<string, number>;
  totalPayments: number;
  totalExpected: number;
  totalPaid: number;
  totalBalance: number;
  paymentsByStatus: Record<string, number>;
  totalAttendance: number;
  attendanceByType: Record<string, number>;
  attendanceByActivity: Record<string, number>;
  totalDeliveries: number;
  deliveriesByType: Record<string, number>;
}
