import { ChangeDetectionStrategy, Component, input } from "@angular/core";
@Component({
  selector: "pf-tax-explanation",
  host: { class: "prose max-w-none block" },
  template: `<h3 id="ike-explanation">Scenariusz bez podatku a IKE</h3>
    <p>
      Wynik bez podatku może pomóc orientacyjnie ocenić korzyść podatkową IKE.
      Zwolnienie przy wypłacie wymaga spełnienia ustawowych warunków wieku i
      historii wpłat. Kalkulator nie sprawdza tych warunków ani limitów wpłat i
      nie uwzględnia kosztów prowadzenia IKE.
    </p>
    @if (bonds()) {
      <p>
        Pominięcie podatku zachowuje modelowe opłaty za wcześniejszy wykup,
        sposób reinwestowania i założone oprocentowanie wypłaconych środków. W
        IKE-Obligacje odsetki automatycznie kupują kolejne obligacje według
        dyspozycji nabywania obligacji skarbowych (DNOS), a wolna gotówka nie
        jest oprocentowana. Przy wypłacie spełniającej warunki zwolnienia lub
        wypłacie transferowej nie pobiera się opłaty za wcześniejszy wykup;
        wcześniejszy zwrot podlega podatkowi i opłatom.
      </p>
      <p>Obligacje rodzinne ROS i ROD nie są dostępne w IKE-Obligacje.</p>
    }
    <p>
      Sprawdź
      <a class="link" href="https://www.obligacjeskarbowe.pl/ike/"
        >zasady IKE-Obligacje</a
      >. Rzeczywisty wynik zależy od warunków rachunku i sposobu zakończenia
      oszczędzania.
    </p> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaxExplanationComponent {
  readonly bonds = input(false);
}
