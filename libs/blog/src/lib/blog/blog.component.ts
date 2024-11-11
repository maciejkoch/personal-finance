import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'pf-blog',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './blog.component.html',
})
export class BlogComponent {}
