import { Injectable, signal } from '@angular/core';
import { defer, Observable, of } from 'rxjs';
import { Expense } from '../models/expense.model';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly storageKey = 'ledgerly-expenses';
  readonly expenses = signal<Expense[]>([]);

  loadExpenses(): void {
    try {
      this.expenses.set(this.readExpenses());
    } catch (error) {
      console.error('Unable to load expenses.', error);
    }
  }

  getExpenseById(id: number): Observable<Expense> {
    return defer(() => {
      const expense = this.readExpenses().find(item => item.id === id);
      if (!expense) throw new Error(`Expense ${id} was not found.`);
      this.expenses.set(this.readExpenses());
      return of(expense);
    });
  }

  addExpense(expense: Omit<Expense, 'id'>): Observable<Expense> {
    return defer(() => {
      const expenses = this.readExpenses();
      const newExpense: Expense = { ...expense, id: this.nextId(expenses) };
      this.writeExpenses([...expenses, newExpense]);
      this.expenses.set([...expenses, newExpense]);
      return of(newExpense);
    });
  }

  updateExpense(id: number, expense: Partial<Expense>): Observable<Expense> {
    return defer(() => {
      const expenses = this.readExpenses();
      const index = expenses.findIndex(item => item.id === id);
      if (index === -1) throw new Error(`Expense ${id} was not found.`);
      const updatedExpense = { ...expenses[index], ...expense, id };
      const updatedExpenses = expenses.map((item, itemIndex) => itemIndex === index ? updatedExpense : item);
      this.writeExpenses(updatedExpenses);
      this.expenses.set(updatedExpenses);
      return of(updatedExpense);
    });
  }

  deleteExpense(id: number): Observable<void> {
    return defer(() => {
      const expenses = this.readExpenses();
      const updatedExpenses = expenses.filter(item => item.id !== id);
      if (updatedExpenses.length === expenses.length) throw new Error(`Expense ${id} was not found.`);
      this.writeExpenses(updatedExpenses);
      this.expenses.set(updatedExpenses);
      return of(void 0);
    });
  }

  private readExpenses(): Expense[] {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return [];
    const expenses: unknown = JSON.parse(stored);
    if (!Array.isArray(expenses)) throw new Error('Stored expenses have an invalid format.');
    return expenses.map(expense => {
      if (!expense || typeof expense !== 'object' || !('id' in expense)) {
        throw new Error('Stored expense has an invalid format.');
      }
      return { ...expense, id: Number(expense.id) } as Expense;
    });
  }

  private writeExpenses(expenses: Expense[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(expenses));
  }

  private nextId(expenses: Expense[]): number {
    return expenses.reduce((highest, expense) => Math.max(highest, expense.id), 0) + 1;
  }
}
