import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarNavComponent, SidebarNavItem } from '../../shared/ui/sidebar-nav/sidebar-nav.component';
import { TopbarComponent } from '../../shared/ui/topbar/topbar.component';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, SidebarNavComponent, TopbarComponent],
  templateUrl: './shell.component.html'
})
export class ShellComponent {
  protected navItems: SidebarNavItem[] = [
    { label: 'Board', route: '/board', icon: 'board' },
    { label: 'Calendar', route: '/calendar', icon: 'calendar' },
    { label: 'Patients', route: '/patients', icon: 'patients' },
    { label: 'Analytics', route: '/analytics', icon: 'analytics' }
  ];
}
