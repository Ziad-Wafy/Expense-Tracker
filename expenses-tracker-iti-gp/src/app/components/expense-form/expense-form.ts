import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ExpenseCategory } from '../../models/expense.model';
import { ExpenseService } from '../../services/expense.service';

function notFuture(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const selected = new Date(`${control.value}T00:00:00`);
  const today = new Date(); today.setHours(23, 59, 59, 999);
  return selected > today ? { futureDate: true } : null;
}

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './expense-form.html',
})
export class ExpenseFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly expenseService = inject(ExpenseService);
  readonly categories: ExpenseCategory[] = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other'];
  readonly editingId = signal<number | null>(null);
  readonly saving = signal(false);
  readonly form = this.fb.nonNullable.group({
    amount: [0, [Validators.required, Validators.min(0.01)]],
    category: ['' as ExpenseCategory, Validators.required],
    date: ['', [Validators.required, notFuture]],
    note: ['', Validators.maxLength(200)],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const numericId = Number(id);
      this.editingId.set(numericId);
      this.expenseService.getExpenseById(numericId).subscribe({
        next: expense => this.form.patchValue({ amount: expense.amount, category: expense.category, date: expense.date, note: expense.note ?? '' }),
        error: error => { console.error('Unable to load expense.', error); this.router.navigate(['/expenses']); },
      });
    }
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const value = this.form.getRawValue();
    const request = this.editingId() === null
      ? this.expenseService.addExpense(value)
      : this.expenseService.updateExpense(this.editingId()!, value);
    request.subscribe({
      next: () => this.router.navigate(['/expenses']),
      error: error => { console.error('Unable to save expense.', error); this.saving.set(false); },
    });
  }
}
