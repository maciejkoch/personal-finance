import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  viewChild,
  signal,
} from "@angular/core";
import {
  form,
  FormField,
  max,
  min,
  required,
  validate,
} from "@angular/forms/signals";
import { RouterLink } from "@angular/router";
import { HeroComponent } from "@shared/ui/hero/hero.component";
import { CalculatorPanelComponent } from "../shared/calculator-panel.component";
import {
  calculateFire,
  FIRE_DEFAULTS,
  FIRE_FIELDS,
  validFireInput,
} from "./fire.model";

@Component({
  selector: "pf-fire",
  imports: [FormField, RouterLink, HeroComponent, CalculatorPanelComponent],
  templateUrl: "./fire.component.html",
  styleUrl: "./fire.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FireComponent {
  readonly formContainer = viewChild<ElementRef<HTMLElement>>("formContainer");
  scrollToForm() {
    this.formContainer()?.nativeElement.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
  readonly fields = FIRE_FIELDS;
  readonly model = signal({ ...FIRE_DEFAULTS });
  readonly form = form(this.model, (path) => {
    for (const field of FIRE_FIELDS) {
      required(path[field.key], { message: "Uzupełnij pole." });
      min(path[field.key], field.min, { message: `Minimum: ${field.min}.` });
      max(path[field.key], field.max, { message: `Maksimum: ${field.max}.` });
      validate(path[field.key], ({ value }) =>
        Number.isFinite(value())
          ? undefined
          : { kind: "finite", message: "Podaj poprawną liczbę." },
      );
    }
    validate(path.age, ({ value }) =>
      Number.isInteger(value())
        ? undefined
        : { kind: "integer", message: "Podaj pełną liczbę lat." },
    );
  });
  readonly result = computed(() =>
    validFireInput(this.model()) ? calculateFire(this.model()) : null,
  );
  readonly time = computed(() => {
    const months = this.result()?.months;
    if (months == null) return "Cel poza horyzontem 100 lat";
    if (months === 0) return "Cel osiągnięty na starcie";
    return `${Math.floor(months / 12)} lat i ${months % 12} mies.`;
  });
  readonly chart = computed(() => {
    const result = this.result();
    if (!result) return null;
    const last = result.points[result.points.length - 1].month || 12;
    const ceiling = Math.max(
      result.target,
      ...result.points.map((p) => p.capital),
    );
    return {
      line: result.points
        .map(
          (p) =>
            `${40 + (p.month / last) * 640},${220 - (p.capital / ceiling) * 190}`,
        )
        .join(" "),
      targetY: 220 - (result.target / ceiling) * 190,
      years: last / 12,
    };
  });
  private readonly currency = new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
  });
  money(value: number) {
    return this.currency.format(value);
  }
  number(value: number) {
    return new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 1 }).format(
      value,
    );
  }
  reset() {
    this.model.set({ ...FIRE_DEFAULTS });
    this.form().reset();
  }
}
