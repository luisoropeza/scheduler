import { Component, input, output } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { BoardCardComponent } from '../board-card/board-card.component';
import { BoardColumn } from '../../../core/models/board.model';
import { AppointmentSummaryItem } from '../../../core/models/api.models';

@Component({
  selector: 'app-board-column',
  imports: [CdkDropList, CdkDrag, BoardCardComponent],
  templateUrl: './board-column.component.html',
  host: { class: 'glass-panel flex w-80 shrink-0 flex-col rounded-3xl' }
})
export class BoardColumnComponent {
  column = input.required<BoardColumn>();
  showDates = input(false);
  /** Disables drag & drop (roles that cannot change appointment status). */
  readonly = input(false);

  dropped = output<CdkDragDrop<AppointmentSummaryItem[]>>();
  open = output<AppointmentSummaryItem>();
}
