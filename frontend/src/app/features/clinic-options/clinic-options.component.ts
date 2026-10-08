import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { Clinic } from '../../core/models/api.models';
import { CardAccent, ClinicOptionCardComponent } from './components/clinic-option-card/clinic-option-card.component';
import { ClinicOptionsResourceService } from './services/clinic-options-resource.service';

const ACCENTS: CardAccent[] = ['primary', 'secondary', 'tertiary'];

/** Entry point for anonymous users: the backend is multi-tenant, so a clinic must be chosen before logging in. */
@Component({
  selector: 'app-clinic-options',
  imports: [ClinicOptionCardComponent, RouterLink],
  providers: [ClinicOptionsResourceService],
  templateUrl: './clinic-options.component.html'
})
export class ClinicOptionsComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly resource = inject(ClinicOptionsResourceService);

  protected readonly lastClinicId = this.auth.clinic()?.id;
  protected readonly accents = ACCENTS;

  protected selectClinic(clinic: Clinic): void {
    this.auth.selectClinic(clinic);
    this.router.navigate(['/login']);
  }
}
