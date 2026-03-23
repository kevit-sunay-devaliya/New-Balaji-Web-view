import { Directive, HostListener, Input } from '@angular/core';
import { ToastService } from '../services/toast.service';

@Directive({ selector: '[appDigitsOnly]' })
export class DigitsOnlyDirective {
  @Input() appDigitsOnly = 3;

  constructor(private toast: ToastService) {}

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const allowed = [
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'Tab',
    ];
    if (!allowed.includes(event.key)) {
      event.preventDefault();
      return;
    }
    const input = event.target as HTMLInputElement;
    const isDigit = event.key >= '0' && event.key <= '9';
    if (isDigit && input.value.length >= this.appDigitsOnly) {
      event.preventDefault();
      this.toast.show(
        `Max ${this.appDigitsOnly} digit${this.appDigitsOnly > 1 ? 's' : ''} allowed (0–${'9'.repeat(this.appDigitsOnly)})`,
      );
    }
  }
}
