import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LongTermSavingsComponent } from './long-term-savings.component';

describe('LongTermSavingsComponent', () => {
  let component: LongTermSavingsComponent;
  let fixture: ComponentFixture<LongTermSavingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LongTermSavingsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LongTermSavingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
