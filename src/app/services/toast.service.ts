import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _visible = new BehaviorSubject<boolean>(false);
  private _message = new BehaviorSubject<string>('');
  readonly visible$ = this._visible.asObservable();
  readonly message$ = this._message.asObservable();
  get visible(): boolean { return this._visible.value; }
  get message(): string { return this._message.value; }
  private timer: any = null;

  show(message: string): void {
    this._message.next(message);
    this._visible.next(true);
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this._visible.next(false);
    }, 2500);
  }
}
