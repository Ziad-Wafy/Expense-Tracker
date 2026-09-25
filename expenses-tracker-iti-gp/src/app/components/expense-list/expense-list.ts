import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { ExpenseCategory } from '../../models/expense.model';
import { ExpenseService } from '../../services/expense.service';
import { CategoryIconPipe } from '../../pipes/category-icon.pipe';
import { HighlightOverBudgetDirective } from '../../directives/highlight-over-budget.directive';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, CategoryIconPipe, HighlightOverBudgetDirective, RouterLink],
  templateUrl: './expense-list.html',
})
export class ExpenseListComponent implements OnInit {
  readonly expenseService = inject(ExpenseService);
  private readonly router = inject(Router);
  readonly categories: ExpenseCategory[] = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other'];
  readonly category = signal<'All' | ExpenseCategory>('All');
  readonly search = signal('');
  readonly sortBy = signal<'date' | 'amount'>('date');
  readonly sortDir = signal<'asc' | 'desc'>('desc');
  readonly filteredExpenses = computed(() => {
    const category = this.category(), query = this.search().trim().toLowerCase();
    return this.expenseService.expenses().filter(expense =>
      (category === 'All' || expense.category === category) &&
      (!query || (expense.note ?? '').toLowerCase().includes(query)),
    ).sort((a, b) => {
      const left = this.sortBy() === 'date' ? new Date(a.date).getTime() : a.amount;
      const right = this.sortBy() === 'date' ? new Date(b.date).getTime() : b.amount;
      return this.sortDir() === 'asc' ? left - right : right - left;
    });
  });
  readonly visibleTotal = computed(() => this.filteredExpenses().reduce((sum, expense) => sum + expense.amount, 0));

  ngOnInit(): void { this.expenseService.loadExpenses(); }
  edit(id: number): void { this.router.navigate(['/edit', Number(id)]); }
  delete(id: number): void {
    if (confirm('Delete this expense?')) this.expenseService.deleteExpense(Number(id)).subscribe({ error: error => console.error('Unable to delete expense.', error) });
  }
}
