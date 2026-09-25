import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';
import { ExpenseFormComponent } from './components/expense-form/expense-form';
import { ExpenseListComponent } from './components/expense-list/expense-list';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'add', component: ExpenseFormComponent },
  { path: 'expenses', component: ExpenseListComponent },
  { path: 'edit/:id', component: ExpenseFormComponent },
  { path: '**', redirectTo: '' },
];
