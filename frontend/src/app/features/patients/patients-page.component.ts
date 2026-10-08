import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Dialog } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';
import { filter, map, of, switchMap } from 'rxjs';
import { PatientsApi } from '../../core/api/patients.api';
import { StaffApi } from '../../core/api/staff.api';
import { AuthService } from '../../core/auth/auth.service';
import { apiErrorMessage } from '../../core/http/api-error';
import { Patient } from '../../core/models/api.models';
import { initials } from '../../core/utils/labels.util';
import { NotificationService } from '../../shared/services/notification.service';
import { ConfirmService } from '../../shared/ui/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { PaginationComponent } from '../../shared/ui/pagination/pagination.component';
import { SegmentedTabItem, SegmentedTabsComponent } from '../../shared/ui/segmented-tabs/segmented-tabs.component';
import { UiIconComponent } from '../../shared/ui/ui-icon/ui-icon.component';
import { AssignDoctorData, AssignDoctorDialogComponent } from './assign-doctor-dialog.component';
import { PatientFormData, PatientFormDialogComponent } from './patient-form-dialog.component';

type Scope = 'mine' | 'all';

const PAGE_SIZE = 12;
/**
 * The backend has no patient search endpoint, so the list is fetched once and filtered client-side.
 * Fine for an MVP clinic size; move to a server-side `?q=` filter if clinics grow past this.
 */
const MAX_PATIENTS = 1000;

@Component({
  selector: 'app-patients-page',
  imports: [FormsModule, PageHeaderComponent, SegmentedTabsComponent, PaginationComponent, EmptyStateComponent, UiIconComponent],
  templateUrl: './patients-page.component.html',
  host: { class: 'flex min-h-0 flex-1 flex-col' }
})
export class PatientsPageComponent {
  private readonly patientsApi = inject(PatientsApi);
  private readonly staffApi = inject(StaffApi);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(Dialog);
  private readonly confirm = inject(ConfirmService);
  private readonly notifications = inject(NotificationService);

  protected readonly isDoctor = this.auth.hasRole('DOCTOR');
  protected readonly tabs: SegmentedTabItem[] = [
    { id: 'mine', label: 'Mis pacientes' },
    { id: 'all', label: 'Todos' }
  ];
  protected readonly scope = signal<Scope>(this.isDoctor ? 'mine' : 'all');
  protected readonly search = signal('');
  protected readonly showInactive = signal(false);
  protected readonly page = signal(0);
  protected readonly initials = initials;

  protected readonly resource = rxResource({
    request: () => this.scope(),
    loader: ({ request }) =>
      request === 'mine'
        ? this.staffApi.patientsOf(this.auth.userId()!)
        : this.patientsApi.list({ size: MAX_PATIENTS, sort: 'id' }).pipe(map((page) => page.content))
  });

  /** Ids of the doctor's own patients, to offer "assign to me" in the "all" tab. */
  private readonly mineResource = rxResource({
    loader: () => (this.isDoctor ? this.staffApi.patientsOf(this.auth.userId()!) : of([] as Patient[]))
  });
  private readonly mineIds = computed(() => new Set((this.mineResource.value() ?? []).map((patient) => patient.id)));

  private readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    return (this.resource.value() ?? [])
      .filter((patient) => this.showInactive() || patient.active)
      .filter((patient) => !term || `${patient.name} ${patient.email} ${patient.phoneNumber ?? ''}`.toLowerCase().includes(term));
  });
  protected readonly totalPages = computed(() => Math.ceil(this.filtered().length / PAGE_SIZE));
  protected readonly total = computed(() => this.filtered().length);
  protected readonly rows = computed(() => this.filtered().slice(this.page() * PAGE_SIZE, (this.page() + 1) * PAGE_SIZE));

  protected isMine(patient: Patient): boolean {
    return this.mineIds().has(patient.id);
  }

  protected setScope(scope: string): void {
    this.scope.set(scope as Scope);
    this.page.set(0);
  }

  protected setSearch(term: string): void {
    this.search.set(term);
    this.page.set(0);
  }

  protected openForm(patient?: Patient): void {
    this.dialog
      .open<Patient, PatientFormData>(PatientFormDialogComponent, { data: { patient }, backdropClass: 'glass-backdrop' })
      .closed.pipe(filter(Boolean))
      .subscribe((saved) => {
        this.notifications.success(patient ? 'Paciente actualizado' : 'Paciente creado');
        if (!patient && this.isDoctor) {
          // New patients of a doctor are linked to them right away so they show up in "Mis pacientes".
          this.staffApi.assignPatient({ patientId: saved.id, doctorId: this.auth.userId()! }).subscribe(() => this.reload());
        } else {
          this.reload();
        }
      });
  }

  protected manageDoctors(patient: Patient): void {
    this.dialog
      .open<void, AssignDoctorData>(AssignDoctorDialogComponent, { data: { patient }, backdropClass: 'glass-backdrop' })
      .closed.subscribe(() => this.reload());
  }

  protected toggleMine(patient: Patient): void {
    const request = { patientId: patient.id, doctorId: this.auth.userId()! };
    const mine = this.isMine(patient);
    (mine ? this.staffApi.removePatient(request) : this.staffApi.assignPatient(request)).subscribe({
      next: () => {
        this.notifications.success(mine ? 'Paciente quitado de tu lista' : 'Paciente agregado a tu lista');
        this.reload();
      },
      error: (error) => this.notifications.error(apiErrorMessage(error))
    });
  }

  protected deactivate(patient: Patient): void {
    this.confirm
      .ask({
        title: 'Desactivar paciente',
        message: `${patient.name} ya no podrá agendar nuevas citas.`,
        confirmLabel: 'Desactivar',
        danger: true
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.patientsApi.deactivate(patient.id))
      )
      .subscribe({
        next: () => {
          this.notifications.success('Paciente desactivado');
          this.reload();
        },
        error: (error) => this.notifications.error(apiErrorMessage(error))
      });
  }

  private reload(): void {
    this.resource.reload();
    this.mineResource.reload();
  }
}
