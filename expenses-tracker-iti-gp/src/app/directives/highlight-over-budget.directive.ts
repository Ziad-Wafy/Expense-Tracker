import { Directive, ElementRef, effect, inject, input, Renderer2 } from '@angular/core';

@Directive({ selector: '[appHighlightOverBudget]', standalone: true })
export class HighlightOverBudgetDirective {
  readonly appHighlightOverBudget = input.required<number>();
  readonly threshold = input(100);

  constructor() {
    const element = inject(ElementRef<HTMLElement>);
    const renderer = inject(Renderer2);
    effect(() => {
      const overBudget = this.appHighlightOverBudget() > this.threshold();
      renderer.setStyle(element.nativeElement, 'background-color', overBudget ? '#fff1f0' : null);
    });
  }
}
