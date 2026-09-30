import { Component, computed, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ClinicOptionsResourceService } from './services/clinic-options-resource.service';
import { LoaderService } from '../../shared/services/loader.service';
import { ClinicOptionCardComponent, CardAccent } from './components/clinic-option-card/clinic-option-card.component';
import { clinicOptions } from './interfaces/clinic-options.interface';

const ACCENTS: CardAccent[] = ['primary', 'secondary', 'tertiary'];

@Component({
  selector: 'app-clinic-options',
  imports: [ClinicOptionCardComponent],
  templateUrl: './clinic-options.component.html',
  styleUrl: './clinic-options.component.scss',
  providers: [ClinicOptionsResourceService]
})
export class ClinicOptionsComponent {
  private readonly resourceService = inject(ClinicOptionsResourceService);
  private readonly loaderService = inject(LoaderService);
  private readonly router = inject(Router);

  protected readonly isLoading = this.resourceService.isLoading;
  protected readonly clinics = computed(() => this.resourceService.data() ?? []);
  protected readonly accents = ACCENTS;

  constructor() {
    effect(() => {
      if (this.isLoading()) {
        this.loaderService.show();
      } else {
        this.loaderService.hide();
      }
    });
  }

  protected selectClinic(_clinic: clinicOptions): void {
    this.router.navigate(['/board']);
  }
}
