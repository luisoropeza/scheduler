import { Component, input } from '@angular/core';
import { InputType } from './enums/input-type.enum';
import { NgClass } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { INPUT_VALUE_ACCESSOR_PROVIDER } from './providers/input-value-accessor.provider';
import { ControlValueAccesorDirective } from './directives/control-value-accesor.directive';
import { getValidationErrorMessage } from '../../utils/validation-messages.util';

@Component({
  selector: 'app-input-component',
  imports: [NgClass, ReactiveFormsModule],
  templateUrl: './input-component.component.html',
  styleUrl: './input-component.component.scss',
  providers: [INPUT_VALUE_ACCESSOR_PROVIDER],
})
export class InputComponentComponent<T> extends ControlValueAccesorDirective<T> {
  label = input.required<string>();
  placeholder = input<string>();
  isRequired = input<boolean>(false);
  type = input<InputType>(InputType.TEXT);

  get errorMessage(): string | null {
    if (!this.control?.touched) return null;
    return getValidationErrorMessage(this.control.errors);
  }
}
