import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { localStorageSignal } from '@pf/shared';
import { DelayedLoaderComponent } from '@pf/ui';
import { mapValues, sortBy } from 'lodash';
import { z } from 'zod';
import { TreasuryBondsResult } from '../../model/treasury-bonds.model';

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
  7: '#00ff00',
  6: '#33ff33',
  5: '#66ff66',
  4: '#99ff99',
  3: '#ccffcc',
  2: '#e6ffe6',
  1: '#f0fff0',
  0: '#f5fff5',
};

const negativeColors: Record<number, string> = {
  7: '#FF0000',
  6: '#B22222',
  5: '#CD5C5C',
  4: '#F08080',
  3: '#FA8072',
  2: '#FFA07A',
  1: '#FFC0CB',
  0: '#FFE4E1',
};

@Component({
    selector: 'pf-treasury-bonds-results',
    imports: [FormsModule, CurrencyPipe, DelayedLoaderComponent],
    templateUrl: './treasury-bonds-results.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
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
          ror: {
            value: value.ror,
          },
          dor: {
            value: value.dor,
          },
          tos: {
            value: value.tos,
          },
          coi: {
            value: value.coi,
          },
          edo: {
            value: value.edo,
          },
          ros: {
            value: value.ros,
          },
          rod: {
            value: value.rod,
          },
        };

        const withClassification = this.classifyValues(row);
        const withColor = this.addColorToValues(withClassification);

        return withColor;
      });
  });

  useColors = localStorageSignal('treasury-bonds-use-colors', z.boolean());

  columns = [
    { property: 'year', label: 'Rok', pinned: true },
    { property: 'ror', label: 'ROR (roczne)' },
    { property: 'dor', label: 'DOR (2-latki)' },
    { property: 'tos', label: 'TOS (3-latki)' },
    { property: 'coi', label: 'COI (4-latki)' },
    { property: 'edo', label: 'EDO (10-latki)' },
    { property: 'rod', label: 'ROD (6-latki)' },
    { property: 'ros', label: 'ROS (12-latki)' },
    {
      property: 'finalValue',
      label: 'Wpłata powiększona o INFLACJĘ',
      wrap: true,
    },
  ];

  loadingItems = Array.from({ length: 10 });

  private classifyValues(data: Row): Row {
    const finalValue = data.finalValue.value;

    const positives = Object.keys(data)
      .filter((key) => key !== 'finalValue' && data[key].value > finalValue)
      .map((key) => ({ key, value: data[key].value }));

    const negatives = Object.keys(data)
      .filter((key) => key !== 'finalValue' && data[key].value <= finalValue)
      .map((key) => ({ key, value: data[key].value }));

    const sortedPositives = sortBy(positives, 'value').reverse();
    const sortedNegatives = sortBy(negatives, 'value');

    sortedPositives.forEach((item, index) => {
      data[item.key].positive = 7 - index;
    });

    sortedNegatives.forEach((item, index) => {
      data[item.key].negative = 7 - index + 1;
    });

    return data;
  }

  private addColorToValues(data: Row): Row {
    return mapValues(data, (value) => {
      if (value.positive !== undefined) {
        value.color = positiveColors[value.positive];
      } else if (value.negative !== undefined) {
        value.color = negativeColors[value.negative];
      }
      return value;
    });
  }
}
