import { Injectable, signal } from '@angular/core';
import { Appointment } from '../models/appointment.model';
import { toIso } from '../utils/calendar.util';

function addDays(base: Date, days: number): Date {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return date;
}

const TODAY = new Date();

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'PT-9942',
    patientName: 'Sarah Jenkins',
    reason: 'Initial Consult - Oncology',
    priority: 'urgent',
    time: '9:00 AM',
    durationMinutes: 45,
    doctor: 'Dr. Smith',
    date: toIso(TODAY)
  },
  {
    id: 'PT-8112',
    patientName: 'Michael Chang',
    reason: 'Follow-up Labs',
    priority: 'medium',
    time: '11:30 AM',
    durationMinutes: 30,
    date: toIso(TODAY)
  },
  {
    id: 'PT-3301',
    patientName: 'Elena Rostova',
    reason: 'Treatment Planning',
    priority: 'low',
    time: '2:00 PM',
    durationMinutes: 60,
    date: toIso(TODAY)
  },
  {
    id: 'PT-5521',
    patientName: 'Tom Wallace',
    reason: 'Post-op Review',
    priority: 'medium',
    time: '10:00 AM',
    durationMinutes: 30,
    date: toIso(addDays(TODAY, -2))
  },
  {
    id: 'PT-7734',
    patientName: 'Nina Petrova',
    reason: 'Annual Checkup',
    priority: 'low',
    time: '1:00 PM',
    durationMinutes: 30,
    date: toIso(addDays(TODAY, 3))
  }
];

/** Mock data source. Swap the body for an HTTP call once the API exists. */
@Injectable({ providedIn: 'root' })
export class CalendarService {
  private readonly _appointments = signal<Appointment[]>(MOCK_APPOINTMENTS);
  readonly appointments = this._appointments.asReadonly();

  appointmentsFor(iso: string): Appointment[] {
    return this._appointments().filter((appointment) => appointment.date === iso);
  }

  add(appointment: Omit<Appointment, 'id'>): void {
    const id = `PT-${Math.floor(1000 + Math.random() * 9000)}`;
    this._appointments.update((list) => [...list, { ...appointment, id }]);
  }
}
