import { Component, inject } from '@angular/core';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-loader',
  imports: [],
  templateUrl: './loader.component.html',
})
export class LoaderComponent {
  private readonly _loaderService = inject(LoaderService);
  protected isLoading = this._loaderService.isLoading;
}
