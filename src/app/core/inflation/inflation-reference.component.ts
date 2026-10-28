import { DecimalPipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { InflationService } from "./inflation.service";

@Component({
  selector: "pf-inflation-reference",
  imports: [DecimalPipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="text-sm my-2 space-y-2" aria-live="polite">
      @if (data.current(); as current) {
        <p>
          Inflacja GUS:
          <strong>{{ current.point.ratePercent | number: "1.1-2" }}% r/r</strong
          >, {{ period(current.point.period) }}.
          <a
            class="link"
            [href]="current.sourcePageUrl"
            target="_blank"
            rel="noopener noreferrer"
            >Źródło: GUS</a
          >
        </p>
        @if (current.dataStale || current.syncStale || data.error()) {
          <p class="text-warning">
            Pokazujemy ostatni odczyt. Aktualizacja danych jest opóźniona.
          </p>
        }
        @if (custom()) {
          <button
            type="button"
            class="btn btn-outline btn-sm h-auto whitespace-normal"
            [disabled]="
              disabled() ||
              current.point.ratePercent < -99 ||
              current.point.ratePercent > 100
            "
            (click)="selected.emit()"
          >
            {{
              current.dataStale || current.syncStale || data.error()
                ? "Użyj ostatniego odczytu"
                : "Ustaw aktualną"
            }}: {{ current.point.ratePercent | number: "1.1-2" }}%
          </button>
        }
        @if (
          current.point.ratePercent < -99 || current.point.ratePercent > 100
        ) {
          <p>Odczyt przekracza zakres kalkulatora. Wpisz własne założenie.</p>
        }
      } @else {
        <p>
          {{
            data.error()
              ? "Nie udało się pobrać inflacji GUS. Wpisz własne założenie lub ponów pobranie."
              : "Pobieranie inflacji GUS… Możesz też wpisać własne założenie."
          }}
        </p>
      }
      @if (data.error()) {
        <button
          type="button"
          class="btn btn-sm btn-outline"
          [disabled]="data.loading()"
          (click)="data.load()"
        >
          Ponów pobranie
        </button>
      }
      <p>
        Ostatni odczyt jako założenie scenariusza. To nie prognoza przyszłej
        inflacji.
      </p>
      <a class="link" routerLink="/inflacja">Zobacz historię inflacji →</a>
    </div>
  `,
})
export class InflationReferenceComponent {
  readonly data = inject(InflationService);
  readonly custom = input(false);
  readonly disabled = input(false);
  readonly selected = output();
  period(value: string) {
    return new Intl.DateTimeFormat("pl-PL", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${value}-01T00:00:00Z`));
  }
}
