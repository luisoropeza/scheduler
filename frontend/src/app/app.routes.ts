import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', redirectTo: 'board', pathMatch: 'full' },
      { path: 'board', loadComponent: () => import('./features/board/board.component').then((m) => m.BoardComponent) },
      { path: 'calendar', loadComponent: () => import('./features/calendar/calendar.component').then((m) => m.CalendarComponent) },
    ]
  },
  { path: 'register', loadComponent: () => import('./features/register/register.component').then((m) => m.RegisterComponent) },
  { path: 'login', loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent) },
  { path: 'clinic-options', loadComponent: () => import('./features/clinic-options/clinic-options.component').then((m)=>m.ClinicOptionsComponent) }
];
