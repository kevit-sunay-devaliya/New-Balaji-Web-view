import { NgModule } from '@angular/core';
import { IndianCurrencyPipe } from '../pipes/indian-currency.pipe';

@NgModule({
  declarations: [IndianCurrencyPipe],
  exports: [IndianCurrencyPipe],
})
export class SharedModule {}
