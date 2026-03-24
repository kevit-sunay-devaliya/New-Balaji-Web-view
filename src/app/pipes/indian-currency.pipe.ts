import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'indianCurrency' })
export class IndianCurrencyPipe implements PipeTransform {
  transform(value: number | string): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '';
    return num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}
