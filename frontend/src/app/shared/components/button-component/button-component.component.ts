import { Component, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'outlined';

@Component({
  selector: 'app-button-component',
  imports: [],
  templateUrl: './button-component.component.html',
  host: { class: 'block' }
})
export class ButtonComponentComponent {
  label = input.required<string>();
  variant = input<ButtonVariant>('primary');
  fullWidth = input(false);
  type = input<'button' | 'submit'>('button');
  disabled = input(false);
  loading = input(false);
}
