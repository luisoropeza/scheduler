import { Component, input } from '@angular/core';
import { BoardAppointment } from '../../../core/models/board.model';

@Component({
  selector: 'app-board-card',
  imports: [],
  templateUrl: './board-card.component.html',
  host: { class: 'block' }
})
export class BoardCardComponent {
  appointment = input.required<BoardAppointment>();
}
