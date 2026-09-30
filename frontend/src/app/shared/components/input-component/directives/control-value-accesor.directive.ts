import { DestroyRef, Directive, inject, Injector, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ControlValueAccessor,
  FormControl,
  FormControlDirective,
  FormControlName,
  FormGroupDirective,
  NgControl,
} from '@angular/forms';

import { distinctUntilChanged, tap } from 'rxjs';

@Directive({
  selector: '[appControlValueAccesor]',
  standalone: true,
})
export class ControlValueAccesorDirective<T> implements ControlValueAccessor, OnInit {
  public control!: FormControl;
  private _onTouched!: () => T;
  private readonly _injector = inject(Injector);
  private readonly _destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.onHandleSetFormControl();
  }

  private onHandleSetFormControl(): void {
    try {
      const formControl: NgControl = this._injector.get(NgControl);

      switch (formControl.constructor) {
        case FormControlName:
          this.control = this._injector.get(FormGroupDirective).getControl(formControl as FormControlName);
          break;
        default:
          this.control = (formControl as FormControlDirective).form as FormControl;
          break;
      }
    } catch (error) {
      console.error(error);
      this.control = new FormControl();
    }
  }

  public writeValue(value: T): void {
    if (this.control?.value === value) return;

    if (this.control) {
      this.control.setValue(value);
      return;
    }

    this.control = new FormControl(value);
  }

  public registerOnChange(fn: (value: T) => void): void {
    this.control?.valueChanges
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        distinctUntilChanged(),
        tap((val) => fn(val))
      )
      .subscribe();
  }

  public registerOnTouched(fn: () => T): void {
    this._onTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.control?.disable({ emitEvent: false });
    } else {
      this.control?.enable({ emitEvent: false });
    }
  }
}
