import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { initials } from '../../../core/utils/labels.util';

@Component({
  selector: 'app-topbar',
  imports: [RouterLink],
  templateUrl: './topbar.component.html',
  host: { class: 'flex items-center justify-between gap-6 px-8 py-6' }
})
export class TopbarComponent {
  userName = input('');
  roleLabel = input('');

  protected readonly greeting = computed(() => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  });
  protected readonly firstName = computed(
    () =>
      this.userName()
        .replace(/^(dr|dra)\.?\s+/i, '')
        .split(' ')[0] ?? ''
  );
  protected readonly avatarInitials = computed(() => initials(this.userName()));
  protected readonly today = ((label: string) => label.charAt(0).toUpperCase() + label.slice(1))(
    new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
  );
}
