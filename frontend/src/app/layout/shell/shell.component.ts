import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { navItemsFor } from '../../core/navigation/navigation';
import { ROLE_LABEL } from '../../core/utils/labels.util';
import { SidebarNavComponent } from '../../shared/ui/sidebar-nav/sidebar-nav.component';
import { TopbarComponent } from '../../shared/ui/topbar/topbar.component';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, SidebarNavComponent, TopbarComponent],
  templateUrl: './shell.component.html'
})
export class ShellComponent {
  private readonly auth = inject(AuthService);

  protected readonly navItems = computed(() => navItemsFor(this.auth.role()));
  protected readonly userName = computed(() => this.auth.session()?.username ?? '');
  protected readonly roleLabel = computed(() => {
    const role = this.auth.role();
    return role ? ROLE_LABEL[role] : '';
  });
  protected readonly clinicName = computed(() => {
    const clinic = this.auth.clinic();
    const session = this.auth.session();
    return clinic && clinic.id === session?.clinicId ? clinic.name : `Clínica #${session?.clinicId ?? ''}`;
  });

  protected logout(): void {
    this.auth.logout();
  }
}
