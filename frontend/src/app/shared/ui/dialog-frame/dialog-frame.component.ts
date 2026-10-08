import { Component, input, output } from '@angular/core';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

/**
 * Glass surface for every CDK dialog: title, optional subtitle, close button, body (default slot)
 * and a footer slot (`<div dialogFooter>`). Open dialogs with `Dialog.open(..., { backdropClass: 'glass-backdrop' })`.
 */
@Component({
  selector: 'app-dialog-frame',
  imports: [UiIconComponent],
  template: `
    <div class="glass-modal flex max-h-[90vh] flex-col rounded-3xl p-6" [class]="widthClass()">
      <div class="mb-5 flex shrink-0 items-start justify-between gap-3">
        <div>
          <h2 class="text-xl font-extrabold text-gray-900">{{ title() }}</h2>
          @if (subtitle()) {
            <p class="text-sm font-medium text-gray-500">{{ subtitle() }}</p>
          }
        </div>
        <button type="button" class="btn-icon -mr-1 -mt-1" (click)="closed.emit()" aria-label="Cerrar">
          <app-ui-icon name="x" class="h-[18px] w-[18px]" />
        </button>
      </div>

      <div class="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
        <ng-content />
      </div>

      <div class="mt-6 flex shrink-0 flex-wrap justify-end gap-2.5 empty:hidden">
        <ng-content select="[dialogFooter]" />
      </div>
    </div>
  `
})
export class DialogFrameComponent {
  title = input.required<string>();
  subtitle = input<string>();
  widthClass = input('w-[28rem] max-w-[calc(100vw-2rem)]');

  closed = output<void>();
}
