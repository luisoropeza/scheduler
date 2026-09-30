import { Component, computed, input, output } from '@angular/core';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { ButtonComponentComponent } from '../../../../shared/components/button-component/button-component.component';
import { clinicOptions } from '../../interfaces/clinic-options.interface';

export type CardAccent = 'primary' | 'secondary' | 'tertiary';

const ACCENT_CLASSES: Record<CardAccent, { badge: string; icon: string }> = {
  primary: { badge: 'bg-primary/10', icon: 'text-primary' },
  secondary: { badge: 'bg-secondary/10', icon: 'text-secondary' },
  tertiary: { badge: 'bg-tertiary/10', icon: 'text-tertiary' }
};

@Component({
  selector: 'app-clinic-option-card',
  imports: [IconComponent, ButtonComponentComponent],
  templateUrl: './clinic-option-card.component.html',
  host: { class: 'block h-full' }
})
export class ClinicOptionCardComponent {
  clinic = input.required<clinicOptions>();
  highlighted = input(false);
  accent = input<CardAccent>('primary');

  select = output<clinicOptions>();

  protected readonly accentClasses = computed(() => ACCENT_CLASSES[this.accent()]);
}
