/** Matches the backend AppointmentStatus enum (see GET /api/appointments/board). */
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

/** Shape returned per item by GET /api/appointments/board — no id on the backend summary yet. */
export interface BoardAppointment {
  id: string;
  clientName: string;
  doctorName?: string;
  /** ISO yyyy-mm-dd */
  appointmentDate: string;
  /** Formatted "hh:mm a", e.g. "02:30 PM" — same format the backend returns. */
  appointmentTime: string;
  status: AppointmentStatus;
}

/** One Kanban column. The board only ever has the 3 backend statuses — no custom workflows. */
export interface BoardColumn {
  id: AppointmentStatus;
  title: string;
  accentClass: string;
  appointments: BoardAppointment[];
}
