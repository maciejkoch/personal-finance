import { CurrencyPipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { localStorageSignal } from "@shared/local-storage/use-local-storage";
import { DelayedLoaderComponent } from "@shared/ui/delayed-loader/delayed-loader.component";
import { z } from "zod";
import { TreasuryBondsResult } from "../../model/treasury-bonds.model";
import { bondValue, visibleBonds } from "../../model/bond-presentation";

// TODO
// Refactor this file:
// 1. Improve and move logic resposible for classifying and coloring values to separate files.
// 2. Make code more generic instead of listing all types of bonds.

type Row = {
  year: RowValue;
  finalValue: RowValue;
  [key: string]: RowValue;
};

type RowValue = {
  value: number;
  color?: string;
  filter?: string;
  positive?: number;
  negative?: number;
};

const positiveColors: Record<number, string> = {
  7: "#00ff00",
  6: "#33ff33",
  5: "#66ff66",
  4: "#99ff99",
  3: "#ccffcc",
  2: "#e6ffe6",
  1: "#f0fff0",
  0: "#f5fff5",
};

const negativeColors: Record<number, string> = {
  // Keep every highlight above WCAG AA contrast on the dark table background.
  7: "#FF5555",
  6: "#EE6666",
  5: "#DD7777",
  4: "#F08080",
  3: "#FA8072",
  2: "#FFA07A",
  1: "#FFC0CB",
  0: "#FFE4E1",
};

@Component({
  selector: "pf-treasury-bonds-results",
  imports: [FormsModule, CurrencyPipe, DelayedLoaderComponent],
  templateUrl: "./treasury-bonds-results.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreasuryBondsResultsComponent {
  results = input<TreasuryBondsResult>();
  loading = input<boolean>();

  rows = computed<Row[]>(() => {
    const results = this.results();
    if (!results) {
      return [];
    }

    return results.values
      .filter((value) => value.month % 12 === 0)
      .map((value) => {
        const row = {
          year: {
            value: value.month / 12,
          },
          finalValue: {
            value: value.futureValue,
          },
          ...Object.fromEntries(
            visibleBonds(results).map((bond) => [
              bond.key,
              { value: bondValue(value, bond.key) },
            ]),
          ),
        };

        const withClassification = this.classifyValues(row);
        const withColor = this.addColorToValues(withClassification);

        return withColor;
      });
  });

  useColors = localStorageSignal("treasury-bonds-use-colors", z.boolean());

  columns = computed<
    { property: string; label: string; pinned?: boolean; wrap?: boolean }[]
  >(() => [
    { property: "year", label: "Rok", pinned: true },
    ...visibleBonds(this.results() ?? { activeBondTypes: [] }).map((bond) => ({
      property: bond.key,
      label: bond.label,
    })),
    {
      property: "finalValue",
      label: "Wpłata powiększona o INFLACJĘ",
      wrap: true,
    },
  ]);

  loadingItems = Array.from({ length: 10 });

  private classifyValues(data: Row): Row {
    const finalValue = data.finalValue.value;

    const positives = Object.keys(data)
      .filter(
        (key) =>
          key !== "year" &&
          key !== "finalValue" &&
          data[key].value > finalValue,
      )
      .map((key) => ({ key, value: data[key].value }));

    const negatives = Object.keys(data)
      .filter(
        (key) =>
          key !== "year" &&
          key !== "finalValue" &&
          data[key].value <= finalValue,
      )
      .map((key) => ({ key, value: data[key].value }));

    const sortedPositives = positives
      .sort((a, b) => a.value - b.value)
      .reverse();
    const sortedNegatives = negatives.sort((a, b) => a.value - b.value);

    sortedPositives.forEach((item, index) => {
      data[item.key].positive = Math.max(
        1,
        7 - Math.floor((index * 7) / Math.max(1, positives.length)),
      );
    });

    sortedNegatives.forEach((item, index) => {
      data[item.key].negative = Math.max(
        1,
        7 - Math.floor((index * 7) / Math.max(1, negatives.length)),
      );
    });

    return data;
  }

  private addColorToValues(data: Row): Row {
    for (const value of Object.values(data)) {
      if (value.positive !== undefined) {
        value.color = positiveColors[value.positive];
      } else if (value.negative !== undefined) {
        value.color = negativeColors[value.negative];
      }
    }
    return data;
  }
}
