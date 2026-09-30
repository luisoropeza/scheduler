import { Validators } from "@angular/forms";

export const REGISTER_FORM = {
  name: ['', [Validators.required]],
  adminName: ['',[Validators.required],],
  adminEmail: ['', [Validators.required, Validators.email]],
  adminPassword: ['', [Validators.required, Validators.minLength(8)]],
  phoneNumber: [''],
}
