import { Component, input, output, signal } from '@angular/core';
import { SelectData } from './interfaces/select-data.interface';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-select-component',
  imports: [NgClass],
  templateUrl: './select-component.component.html',
  styleUrl: './select-component.component.scss'
})
export class SelectComponentComponent<T> {
  label = input.required<string>();
  placeholder = input<string>();
  isRequired = input<boolean>(false);
  data = input<SelectData<T>[]>();
  isSearchable = input<boolean>(false);

  onSearch = output<string>();

  isOpen = signal(false);
  selected = signal<SelectData<T> | null>(null);

  toggle() {
    this.isOpen.update((value) => !value);
  }

  close() {
    this.isOpen.set(false);
  }

  select(item: SelectData<T>) {
    this.selected.set(item);
    this.close();
  }

  search(term: string) {
    this.onSearch.emit(term);
  }
}
