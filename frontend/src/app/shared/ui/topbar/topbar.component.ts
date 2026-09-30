import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-topbar',
  imports: [],
  templateUrl: './topbar.component.html',
  host: { class: 'flex items-center justify-between gap-6 px-8 py-6' }
})
export class TopbarComponent {
  searchPlaceholder = input('Search...');
  avatarInitial = input('A');

  notificationsClick = output<void>();
}
