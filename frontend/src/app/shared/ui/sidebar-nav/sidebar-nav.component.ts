import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface SidebarNavItem {
  label: string;
  route: string;
  icon: 'board' | 'calendar' | 'patients' | 'analytics';
}

@Component({
  selector: 'app-sidebar-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar-nav.component.html',
  host: { class: 'glass-panel relative z-10 m-4 flex w-72 shrink-0 flex-col rounded-3xl !border-white/70' }
})
export class SidebarNavComponent {
  navItems = input.required<SidebarNavItem[]>();
}
