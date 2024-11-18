import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { of, switchMap, timer } from 'rxjs';

@Component({
  selector: 'pfui-delayed-loader',
  template: `
    @if(showLoader()) {
    <ng-content select="[loader]"></ng-content>
    } @if(showContent()) {
    <ng-content select="[content]"></ng-content>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class DelayedLoaderComponent {
  loading = input<boolean>();

  showLoader = signal(false);
  showContent = computed(() => !this.showLoader());

  START_AFTER = 400;
  STOP_AFTER = 1000;

  constructor() {
    toObservable(this.loading)
      .pipe(
        switchMap((isLoading) =>
          isLoading
            ? timer(this.START_AFTER).pipe(
                switchMap(() => {
                  this.showLoader.set(true);
                  return of(true);
                })
              )
            : timer(this.STOP_AFTER).pipe(
                switchMap(() => {
                  this.showLoader.set(false);
                  return of(false);
                })
              )
        ),
        takeUntilDestroyed()
      )
      .subscribe();
  }
}
