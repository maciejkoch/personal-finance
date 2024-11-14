import { JsonPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { TreasuryBondsResult } from '../../model/treasury-bonds.model';

type Row = {
  year: number;
  finalValue: number;
  [key: string]: number;
};

@Component({
  selector: 'pf-treasury-bonds-results',
  standalone: true,
  imports: [JsonPipe],
  templateUrl: './treasury-bonds-results.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreasuryBondsResultsComponent {
  results = input<TreasuryBondsResult>();

  rows = computed<Row[]>(() => {
    const results = this.results();
    if (!results) {
      return [];
    }

    return results.values
      .filter((value) => value.month % 12 === 0)
      .map((value) => ({
        year: value.month / 12,
        finalValue: value.futureValue,
        ror: value.ror.finalValueAtEndOfMath,
        dor: value.dor.finalValueAtEndOfMath,
        tos: value.tos.finalValueAtEndOfMath,
        coi: value.coi.finalValueAtEndOfMath,
        edo: value.edo.finalValueAtEndOfMath,
        ros: value.ros.finalValueAtEndOfMath,
        rod: value.rod.finalValueAtEndOfMath,
      }));
  });

  columns = [
    { property: 'year', label: 'Rok', pinned: true },
    { property: 'ror', label: 'ROR' },
    { property: 'dor', label: 'DOR' },
    { property: 'tos', label: 'TOS' },
    { property: 'coi', label: 'COI' },
    { property: 'edo', label: 'EDO' },
    { property: 'rod', label: 'ROD' },
    { property: 'ros', label: 'ROS' },
    { property: 'finalValue', label: 'Rzeczywista wartość' },
  ];
}
