import { Component, computed, input } from '@angular/core';

export type BadgeTone = 'primary' | 'secondary' | 'tertiary' | 'neutral' | 'danger';
export type BadgeVariant = 'soft' | 'solid';

const SOFT_CLASSES: Record<BadgeTone, string> = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  tertiary: 'bg-tertiary/10 text-tertiary',
  neutral: 'bg-gray-100 text-gray-600',
  danger: 'bg-red-50 text-red-600'
};

const SOLID_CLASSES: Record<BadgeTone, string> = {
  primary: 'bg-primary text-white',
  secondary: 'bg-secondary text-white',
  tertiary: 'bg-tertiary text-white',
  neutral: 'bg-neutral text-gray-700',
  danger: 'bg-red-600 text-white'
};

@Component({
  selector: 'app-badge',
  template: `<span class="inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold" [class]="classes()">
    <ng-content />
  </span>`
})
export class BadgeComponent {
  tone = input<BadgeTone>('neutral');
  variant = input<BadgeVariant>('soft');

  protected classes = computed(() =>
    this.variant() === 'solid' ? SOLID_CLASSES[this.tone()] : SOFT_CLASSES[this.tone()]
  );
}
