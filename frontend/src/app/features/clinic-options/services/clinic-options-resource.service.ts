import { computed, inject, Injectable } from '@angular/core';
import { ClinicOptionsService } from '../../../shared/services/clinic-options.service';
import { rxResource } from '@angular/core/rxjs-interop';

@Injectable()
export class ClinicOptionsResourceService {
  private readonly _clinicOptionsService = inject(ClinicOptionsService)
  clinicsResource = rxResource({
    loader: () => this._clinicOptionsService.getClinicOptions()
  });

    public isLoading = computed(() => this.clinicsResource.isLoading())
    public data = computed(() => this.clinicsResource.value())

}
