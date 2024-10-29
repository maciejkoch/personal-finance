import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeaderComponent, LayoutComponent } from '@pf/layout';

@Component({
  standalone: true,
  imports: [RouterModule, LayoutComponent, HeaderComponent],
  selector: 'pf-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  title = 'personal-finance';
}
