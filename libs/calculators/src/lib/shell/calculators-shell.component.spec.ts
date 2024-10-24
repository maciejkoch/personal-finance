import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalculatorsShellComponent } from './calculators-shell.component';

describe('CalculatorsShellComponent', () => {
  let component: CalculatorsShellComponent;
  let fixture: ComponentFixture<CalculatorsShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalculatorsShellComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CalculatorsShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
