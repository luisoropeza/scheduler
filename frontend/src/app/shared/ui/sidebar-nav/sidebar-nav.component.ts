import { Component, computed, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NavItem } from '../../../core/navigation/navigation';
import { initials } from '../../../core/utils/labels.util';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

@Component({
  selector: 'app-sidebar-nav',
  imports: [RouterLink, RouterLinkActive, UiIconComponent],
  templateUrl: './sidebar-nav.component.html',
  host: { class: 'glass-panel relative z-10 m-4 flex w-72 shrink-0 flex-col rounded-3xl !border-white/70' }
})
export class SidebarNavComponent {
  navItems = input.required<NavItem[]>();
  clinicName = input('Mi clínica');
  roleLabel = input('');

  logout = output<void>();

  protected readonly clinicInitials = computed(() => initials(this.clinicName()));
}
