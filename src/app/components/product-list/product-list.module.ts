import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { ProductListComponent } from './product-list.component';
import { HeaderComponent } from '../header/header.component';
import { ProductCardComponent } from '../product-card/product-card.component';
import { DigitsOnlyDirective } from '../../directives/digits-only.directive';
import { SharedModule } from '../../shared/shared.module';

const routes: Routes = [{ path: '', component: ProductListComponent }];

@NgModule({
  declarations: [ProductListComponent, HeaderComponent, ProductCardComponent, DigitsOnlyDirective],
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes), SharedModule],
})
export class ProductListModule {}
