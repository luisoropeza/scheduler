export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Appointment {
  id: string;
  patientName: string;
  reason: string;
  priority: Priority;
  time?: string;
  doctor?: string;
  waitMinutes?: number;
  /** ISO yyyy-mm-dd — set on appointments that belong to a calendar day. */
  date?: string;
  durationMinutes?: number;
}
