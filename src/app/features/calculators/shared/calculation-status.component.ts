import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";

@Component({
  selector: "pf-calculation-status",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div role="status" aria-live="polite" aria-atomic="true" class="mb-3">
      @if (loading()) {
        <p class="flex items-center gap-2">
          <span
            class="loading loading-spinner loading-sm"
            aria-hidden="true"
          ></span
          >Przeliczanie…
        </p>
      }
      @if (stale()) {
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
}
