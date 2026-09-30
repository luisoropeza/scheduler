import { Component, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'outlined';

@Component({
  selector: 'app-button-component',
  imports: [],
  templateUrl: './button-component.component.html',
  styleUrl: './button-component.component.scss',
  host: { class: 'block' }
})
export class ButtonComponentComponent {
  label = input.required<string>();
  variant = input<ButtonVariant>('primary');
  fullWidth = input(false);
}
