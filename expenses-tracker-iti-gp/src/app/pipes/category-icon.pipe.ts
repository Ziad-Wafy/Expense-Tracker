import { Pipe, PipeTransform } from '@angular/core';
import { ExpenseCategory } from '../models/expense.model';

@Pipe({ name: 'categoryIcon', standalone: true })
export class CategoryIconPipe implements PipeTransform {
  transform(category: ExpenseCategory): string {
    const icons: Record<ExpenseCategory, string> = {
      Food: '🍔', Transport: '🚗', Shopping: '🛍', Bills: '💡',
      Entertainment: '🎬', Other: '📦',
    };
    return `${icons[category]} ${category}`;
  }
}
