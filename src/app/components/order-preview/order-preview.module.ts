import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { OrderPreviewComponent } from './order-preview.component';
import { SharedModule } from '../../shared/shared.module';

const routes: Routes = [{ path: '', component: OrderPreviewComponent }];

@NgModule({
  declarations: [OrderPreviewComponent],
  imports: [CommonModule, RouterModule.forChild(routes), SharedModule],
})
export class OrderPreviewModule {}
