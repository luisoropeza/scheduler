import { Component, input, output } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { BoardCardComponent } from '../board-card/board-card.component';
import { BoardAppointment, BoardColumn } from '../../../core/models/board.model';

@Component({
  selector: 'app-board-column',
  imports: [CdkDropList, CdkDrag, BoardCardComponent],
  templateUrl: './board-column.component.html',
  host: { class: 'glass-panel flex w-80 shrink-0 flex-col rounded-3xl' }
})
export class BoardColumnComponent {
  column = input.required<BoardColumn>();
  dropped = output<CdkDragDrop<BoardAppointment[]>>();
}
