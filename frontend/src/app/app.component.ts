import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoaderComponent } from './shared/ui/loader/loader.component';
import { NotificationComponent } from './shared/ui/notification/notification.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoaderComponent, NotificationComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'scheduler-front';
}
