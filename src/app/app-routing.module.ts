import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'order', pathMatch: 'full' },
  {
    path: 'order',
    loadChildren: () =>
      import('./components/product-list/product-list.module').then(
        (m) => m.ProductListModule,
      ),
  },
  {
    path: 'preview',
    loadChildren: () =>
      import('./components/order-preview/order-preview.module').then(
        (m) => m.OrderPreviewModule,
      ),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
