import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  input,
  viewChild,
} from '@angular/core';
import Chart, { ChartItem } from 'chart.js/auto';
import { TreasuryBondsResult } from '../../model/treasury-bonds.model';

@Component({
  selector: 'pf-treasury-bonds-chart',
  standalone: true,
  imports: [],
  templateUrl: './treasury-bonds-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreasuryBondsChartComponent {
  canvas = viewChild<ElementRef>('canvas');

  data = input<TreasuryBondsResult>();

  #chart: Chart | null = null;

  constructor() {
    effect(() => {
      const canvas = this.canvas()?.nativeElement as ChartItem;
      // TODO to check monthly data. This is a temporary solution
      const data = this.data()?.values.filter(
        (value) => value.month % 12 === 0
      );
      if (canvas && data) {
        if (!this.#chart) {
          this.#chart = this.#createChart();
        }

        // TODO
        // 1. Adjust colors and move to a separate file
        // 2. make it generic (e.g loop over all bond types)
        const labels = data.map((value) => value.month / 12);
        const futureValue = data.map((value) => value.futureValue);
        const ror = data.map((value) => value.ror);
        const dor = data.map((value) => value.dor);
        const tos = data.map((value) => value.tos);
        const coi = data.map((value) => value.coi);
        const edo = data.map((value) => value.edo);
        const rod = data.map((value) => value.rod);
        const ros = data.map((value) => value.ros);

        const futureValueDataset = {
          label: 'Wpłaty powiększone o INFLACJĘ',
          data: futureValue,
          backgroundColor: '#e11d48',
          borderColor: '#e11d48',
          borderDash: [5, 5],
          pointRadius: 0,
        };

        const rorDataset = {
          label: 'ROR (roczne)',
          data: ror,
          backgroundColor: '#9333ea',
          borderColor: '#9333ea',
          pointRadius: 0,
        };

        const dorDataset = {
          label: 'DOR (2-latki)',
          data: dor,
          backgroundColor: '#14b8a6',
          borderColor: '#14b8a6',
          pointRadius: 0,
        };

        const tosDataset = {
          label: 'TOS (3-latki)',
          data: tos,
          backgroundColor: '#84cc16',
          borderColor: '#84cc16',
          pointRadius: 0,
        };

        const coiDataset = {
          label: 'COI (4-latki)',
          data: coi,
          backgroundColor: '#84cc16',
          borderColor: '#84cc16',
          pointRadius: 0,
        };

        const edoDataset = {
          label: 'EDO (10-latki)',
          data: edo,
          backgroundColor: '#facc15',
          borderColor: '#facc15',
          pointRadius: 0,
        };

        const rodDataset = {
          label: 'ROD (6-latki)',
          data: rod,
          backgroundColor: '#64748b',
          borderColor: '#64748b',
          pointRadius: 0,
        };

        const rosDataset = {
          label: 'ROS (12-latki)',
          data: ros,
          backgroundColor: '#f43f5e',
          borderColor: '#f43f5e',
          pointRadius: 0,
        };

        const datasets = [
          futureValueDataset,
          rorDataset,
          dorDataset,
          tosDataset,
          coiDataset,
          edoDataset,
          rodDataset,
          rosDataset,
        ];

        this.#chart.data = {
          labels,
          datasets,
        };

        this.#chart.update();
      }
    });
  }

  #createChart() {
    return new Chart(this.canvas()?.nativeElement as ChartItem, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            data: [],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
            },
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Value',
            },
          },
        },
      },
    });
  }
}


