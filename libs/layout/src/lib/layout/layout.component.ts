import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'pf-layout',
  standalone: true,
  imports: [],
  templateUrl: './layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {}
