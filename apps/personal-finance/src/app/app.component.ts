import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '@pf/layout';
import { NavigationComponent } from '@pf/navigation';

@Component({
  standalone: true,
  imports: [RouterModule, HeaderComponent, NavigationComponent],
  selector: 'pf-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  title = 'personal-finance';
}
