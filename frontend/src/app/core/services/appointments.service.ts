import { Injectable, signal } from '@angular/core';
import { BoardAppointment } from '../models/board.model';
import { toIso } from '../utils/calendar.util';

function addDays(base: Date, days: number): Date {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return date;
}

const TODAY = new Date();

/** Mock data shaped like GET /api/appointments/board. Swap for an HTTP call once the API is wired up. */
const MOCK_APPOINTMENTS: BoardAppointment[] = [
  { id: 'APT-1001', clientName: 'Alice Johnson', doctorName: 'Dr. Smith', appointmentDate: toIso(TODAY), appointmentTime: '10:30 AM', status: 'PENDING' },
  { id: 'APT-1002', clientName: 'Robert Davis', doctorName: 'Dr. Smith', appointmentDate: toIso(TODAY), appointmentTime: '11:15 AM', status: 'PENDING' },
  { id: 'APT-1003', clientName: 'Maria Garcia', doctorName: 'Dr. Lee', appointmentDate: toIso(TODAY), appointmentTime: '09:00 AM', status: 'CONFIRMED' },
  { id: 'APT-1004', clientName: 'John Doe', doctorName: 'Dr. Smith', appointmentDate: toIso(addDays(TODAY, -1)), appointmentTime: '09:05 AM', status: 'CONFIRMED' },
  { id: 'APT-1005', clientName: 'Jane Roe', doctorName: 'Dr. Lee', appointmentDate: toIso(addDays(TODAY, 1)), appointmentTime: '09:20 AM', status: 'CANCELLED' }
];

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private readonly _appointments = signal<BoardAppointment[]>(MOCK_APPOINTMENTS);
  readonly appointments = this._appointments.asReadonly();
}
