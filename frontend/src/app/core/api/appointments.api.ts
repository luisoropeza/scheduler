import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  AppointmentBoard,
  AppointmentCalendar,
  AppointmentFilters,
  AppointmentRequest,
  AppointmentResponse,
  AppointmentStatus,
  AppointmentSummaryItem,
  AppointmentSummaryWire,
  Page
} from '../models/api.models';
import { toHttpParams } from '../http/http-params.util';

/**
 * For DOCTOR and PATIENT callers the backend forces doctorId/patientId to the caller's own id,
 * so the same calls work for every role.
 */
@Injectable({ providedIn: 'root' })
export class AppointmentsApi {
  private readonly http = inject(HttpClient);

  list(filters: AppointmentFilters = {}): Observable<Page<AppointmentResponse>> {
    return this.http.get<Page<AppointmentResponse>>('appointments', { params: toHttpParams(filters) });
  }

  get(id: number): Observable<AppointmentResponse> {
    return this.http.get<AppointmentResponse>(`appointments/${id}`);
  }

  /** PATIENT bookings start PENDING, staff bookings are CONFIRMED directly. */
  book(request: AppointmentRequest): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>('appointments', request);
  }

  /** DOCTOR / ASSISTANT only. */
  confirm(id: number): Observable<AppointmentResponse> {
    return this.http.patch<AppointmentResponse>(`appointments/${id}/confirm`, null);
  }

  /** DOCTOR / ASSISTANT only. */
  cancel(id: number): Observable<AppointmentResponse> {
    return this.http.patch<AppointmentResponse>(`appointments/${id}/cancel`, null);
  }

  /** `from`/`to` are inclusive ISO dates. */
  board(query: { from: string; to: string; doctorId?: number; patientId?: number }): Observable<AppointmentBoard> {
    return this.http.get<Record<AppointmentStatus, AppointmentSummaryWire[]>>('appointments/board', { params: toHttpParams(query) }).pipe(
      map((board) => {
        const normalized = {} as AppointmentBoard;
        for (const [status, items] of Object.entries(board) as [AppointmentStatus, AppointmentSummaryWire[]][]) {
          normalized[status] = (items ?? []).map((item) => toSummaryItem(item, status));
        }
        return normalized;
      })
    );
  }

  /** `month` is 1-12. */
  calendar(query: { month: number; year: number; doctorId?: number; patientId?: number }): Observable<AppointmentCalendar> {
    return this.http.get<Record<string, AppointmentSummaryWire[]>>('appointments/calendar', { params: toHttpParams(query) }).pipe(
      map((calendar) => {
        const normalized: AppointmentCalendar = {};
        for (const [day, items] of Object.entries(calendar)) normalized[day] = (items ?? []).map((item) => toSummaryItem(item));
        return normalized;
      })
    );
  }
}

function toSummaryItem(item: AppointmentSummaryWire, status?: AppointmentStatus): AppointmentSummaryItem {
  return {
    id: item.id ?? null,
    clientName: item.clientName,
    doctorName: item.doctorName,
    appointmentDate: item.appointmentDate,
    appointmentTime: item.appointmentTime,
    startTime: item.startTime ?? `${item.appointmentDate}T${to24h(item.appointmentTime)}:00`,
    endTime: item.endTime ?? null,
    status: item.status ?? status ?? null,
    doctorId: item.doctorId ?? null,
    patientId: item.patientId ?? null
  };
}

/** "09:30 AM" / "12:15 PM" → "09:30" / "12:15". */
function to24h(time: string): string {
  const match = /^(\d{1,2}):(\d{2})\s*([AP]M)$/i.exec(time.trim());
  if (!match) return time.slice(0, 5);
  let hours = Number(match[1]) % 12;
  if (match[3].toUpperCase() === 'PM') hours += 12;
  return `${String(hours).padStart(2, '0')}:${match[2]}`;
}
