import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { mapTo, of, switchMap, timer } from "rxjs";

@Component({
  selector: "pf-calculation-status",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      class="mb-3 min-h-6"
    >
      @if (showLoading()) {
        <p class="flex items-center gap-2">
          <span
            class="loading loading-spinner loading-sm"
            aria-hidden="true"
          ></span
          >Aktualizowanie wyników…
        </p>
      } @else if (stale() && !loading()) {
        <p class="font-semibold">Wynik dla poprzednich ustawień</p>
      }
    </div>
    @if (error(); as message) {
      <div class="alert alert-error mb-4" role="alert">
        <p>{{ message }}</p>
        <button type="button" class="btn btn-sm" (click)="retried.emit()">
          Spróbuj ponownie
        </button>
      </div>
    }
  `,
})
export class CalculationStatusComponent {
  readonly loading = input(false);
  readonly stale = input(false);
  readonly error = input<string | null>(null);
  readonly retried = output<void>();
  readonly showLoading = toSignal(
    toObservable(this.loading).pipe(
      switchMap((loading) =>
        loading ? timer(500).pipe(mapTo(true)) : of(false),
      ),
    ),
    { initialValue: false },
  );
}
