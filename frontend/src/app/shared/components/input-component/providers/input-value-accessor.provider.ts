import { forwardRef, Provider } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { InputComponentComponent } from '../input-component.component';


export const INPUT_VALUE_ACCESSOR_PROVIDER: Provider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => InputComponentComponent),
  multi: true,
};
