import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { clinicOptions } from '../../features/clinic-options/interfaces/clinic-options.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClinicOptionsService {
  private readonly _http = inject(HttpClient)

  public getClinicOptions(): Observable<clinicOptions[]> {
    return this._http.get<clinicOptions[]>('clinics/mine')
  }

}
