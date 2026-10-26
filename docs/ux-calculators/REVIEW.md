# Przegląd UI/UX trzech kalkulatorów

Data: 26.10.2026. Branch: `codex/calculators-ux-review`.
Status: wariant „Obok wyniku” zaakceptowany i wdrożony. Wyniki kontroli oraz zakres zmian: [IMPLEMENTATION.md](IMPLEMENTATION.md).

## Wnioski z obecnego kodu

- Obligacje: dwa panele założeń, ale checkboxy rodzinne/podatkowe oraz wybór oferty znajdują się poza nimi. Miesiąc oferty istotnie zmienia wejście, więc powinien należeć do głównych założeń.
- Cel i regularne oszczędzanie: formularze bez grup. Checkboxy pomijania inflacji/stopy oraz rozwijana pomoc IKE wydłużają kolumnę formularza.
- Podsumowania wszystkich trzech kalkulatorów są obecnie widoczne, lecz zapisane jako długie, wyśrodkowane akapity. Główna liczba konkuruje z liczbami pomocniczymi.
- Obligacje mają kolejno opis, wykres końcowy, tabelę roczną, wykres przebiegu, ofertę, rozwijane założenia i osobny tekst metodologii. Cel i regularne oszczędzanie mają otwartą metodologię. Ten sam rodzaj treści ma różny sposób prezentacji.
- Pola używają stale pomarańczowych obramowań. Neutralny stan spoczynku pozwoli wyraźniej pokazać focus i błąd.
- Błędy formularzy są zbiorcze i wymieniają wszystkie limity. Przy wdrożeniu warto pokazywać konkretny problem przy polu oraz otwierać grupę z błędem.
- W obligacjach selektor oferty ma kolory `slate` zamiast tokenów motywu. To utrudnia spójność stanów i przyszłe zmiany motywu.

Podstawa: szablony formularzy, strony kalkulatorów, opisy wyników, `tax-options`, wspólny accordion, `styles.css`, `ui.css`, `package.json`. Graf MCP wskazał komponenty; szablony odczytano z plików. To analiza kodu i prototypu, nie test użyteczności z użytkownikami ani audyt działającej produkcji.

## Wspólna hierarchia

1. Krótki nagłówek z opisem. Mniejszy hero ogranicza odległość do formularza.
2. Formularz: każda kontrolka scenariusza wewnątrz nazwanej grupy.
3. Zawsze widoczny główny wynik, dwa parametry pomocnicze oraz wykres przeglądowy.
4. Jednolita seria paneli rozwijanych: szczegóły wyniku; warunki oferty (tylko obligacje); jak liczymy i co warto wiedzieć.
5. Metodologia zachowana w HTML renderowanym na serwerze. Zwijanie nie może usuwać treści, wzorów, źródeł i linków z dokumentu.

Standaryzacja oznacza te same reguły widoczności, nie zwinięcie całej strony. Główne założenia i wynik pozostają dostępne bez kliknięcia. Dodatkowe założenia są domyślnie zwinięte, z aktualnym podsumowaniem wartości. Podatek/uprawnienia są początkowo otwarte. Panele otwierają się niezależnie; otwarcie jednego nie zamyka innych. Zmienione ustawienia muszą pozostać czytelne w nagłówku po zwinięciu.

## Rozmieszczenie kontrolek

| Grupa | Obligacje | Oszczędzanie na cel | Regularne oszczędzanie |
| --- | --- | --- | --- |
| Założenia główne — otwarte | Liczba obligacji, okres, miesiąc oferty; obok liczby informacja o nominale i łącznej kwocie | Kapitał początkowy, dzisiejsza wartość celu, okres | Kapitał początkowy, miesięczna wpłata, okres |
| Założenia dodatkowe — zwinięte | Inflacja, przyszła stopa NBP, oprocentowanie wypłaconych środków | Inflacja + „Pomiń inflację”; stopa zwrotu + „Pomiń stopę zwrotu” | Stopa zwrotu + „Pomiń stopę zwrotu” |
| Podatek i uprawnienia / Podatek — otwarte | „Pomiń podatek Belki”, uprawnienie rodzinne i informacja o limicie | „Pomiń podatek Belki” | „Pomiń podatek Belki” |
| Widok tabeli — w szczegółach wyniku | „Wyróżnij różnice” | — | — |

Kontrolka „Wyróżnij różnice” steruje prezentacją tabeli, więc otrzymuje własny box przy tabeli. Wszystkie pozostałe kontrolki zmieniają obliczenia i należą do formularza. Przywracanie domyślnych ustawień obligacji pozostaje akcją formularza. Pomoc IKE trafia do jednolitej sekcji wyjaśnień; krótka informacja o znaczeniu checkboxa zostaje przy podatku.

## Wynik i treści

| Kalkulator | Główna liczba | Domyślnie widoczne | Rozwijane szczegóły |
| --- | --- | --- | --- |
| Obligacje | Najwyższa kwota w scenariuszu + nazwa serii, po podatku i opłatach zgodnie z ustawieniem | Kapitał, zysk, porównanie końcowe; próg siły nabywczej i nadwyżka/niedobór muszą być zachowane we wdrożeniu | Tabela roczna i wykres przebiegu, oddzielnie pełna oferta ze źródłami |
| Cel | Wymagana miesięczna wpłata | Przyszła wartość celu, kapitał, późniejsze wpłaty, wykres brutto | Pełne rozliczenie, brutto, netto, podatek; stan celu pokrytego kapitałem |
| Regularne | Końcowa wartość netto | Wniesione środki, zysk netto, wykres brutto | Podział kapitału i wpłat, odsetki, brutto, podatek |

Wykres brutto i wynik netto muszą mieć jednoznaczne etykiety. Serii obligacji nie nazywamy „najlepszą” bez określenia kryterium. Stan przeliczania/nieaktualności pozostaje przy wyniku, wraz z istniejącym ponowieniem błędu. Stare kwoty nie mogą wyglądać jak wynik nowych ustawień.

## Dwa warianty mockupów

`mockup.html` zawiera fragment do podglądu w rozmowie. Dwa warianty układu, każdy z przełącznikiem wszystkich trzech kalkulatorów. Przełącznik kalkulatora jest skrótem nawigacji na potrzeby prezentacji; docelowe URL pozostają osobne. Kontrolka projektowa „Widok telefonu” pozwala porównać szerokość mobilną. Zawartość pomocy i tabel jest skrócona; wdrożenie zachowa pełną treść.

- **Obok wyniku — rekomendowany:** główne założenia po lewej, wynik i wykres po prawej. Pozwala zmieniać scenariusz i śledzić rezultat. Na telefonie formularz przechodzi nad wyniki. W docelowym szerokim layoucie należy uwzględnić istniejące menu boczne; mockup używa skrótu nawigacji zamiast odwzorowywać stały sidebar 250 px.
- **Nad wynikiem:** trzy grupy formularza w jednym rzędzie, niżej wynik i wykres. Daje więcej miejsca wynikom, lecz rozwijanie ustawień zwiększa odległość do nich. Na telefonie grupy układają się pionowo.

Mockupy używają przykładowych danych. Pola można edytować, ale nie uruchamiają backendu: po edycji pojawia się komunikat o zmianie założeń. Przykład TOS pochodzi z obecnej metodologii (100 × 111,16 zł). Pozostałe słupki pokazują wyłącznie kompozycję i nie są rankingiem obliczonym dla wybranej oferty. Przykłady celu i regularnych wpłat odpowiadają przykładom w obecnych opisach. Wykresy przebiegu są poglądowe.

## daisyUI — aktualne możliwości

W repo jest **5.7.50**; oficjalny changelog wskazuje tę samą wersję na 26.10.2026. Nie potrzeba aktualizacji zależności do proponowanych zmian. Projekt zachowuje własny motyw `pf`, więc korzystanie z v5 nie oznacza zmiany marki.

| Możliwość | Zastosowanie | Decyzja |
| --- | --- | --- |
| `fieldset` / `fieldset-legend` | Semantyczne grupy formularza, jednakowe boxy | Wykorzystać; nie mnożyć zagnieżdżonych boxów |
| `label` wewnątrz inputa | Jednostki zł, %, lat przy wartości | Wykorzystać, zachowując widoczną etykietę nad polem |
| `collapse` na `details` / `summary` | Dodatkowe założenia, szczegóły i metodologia | Rozwinąć istniejący wzorzec; otwieranie niezależne |
| `stat` | Wyraźny wynik i krótki kontekst | Wykorzystać oszczędnie, bez mnożenia kart KPI |
| `status`, `loading`, `skeleton`, łagodne warianty alertów | Trwające obliczenie i błąd | Ujednolicić prezentację, zachować tekst i istniejący retry |
| `validator`, `validator-hint` | Wygląd błędu przy polu | Dopasować do Signal Forms; walidacja Angular pozostaje źródłem stanu, natywne selektory CSS nie zastępują kontraktów |
| `tabs-border` / `tabs-box` | Alternatywnie widoki wykres/tabela | Dostępne, ale nie rekomenduję kolejnego mechanizmu ukrywania obok paneli rozwijanych |
| Floating labels | Oszczędność miejsca | Nie rekomenduję tutaj: stałe etykiety są łatwiejsze do skanowania i porównywania |
| Dock, FAB, filter, dekoracyjne efekty | Nowe wzorce nawigacji i akcji | Bez uzasadnienia dla tych kalkulatorów |

Źródła oficjalne, sprawdzone 26.10.2026:

- [Changelog](https://daisyui.com/docs/changelog/)
- [Fieldset](https://daisyui.com/components/fieldset/)
- [Label i jednostki](https://daisyui.com/components/label/)
- [Collapse](https://daisyui.com/components/collapse/)
- [Validator](https://daisyui.com/components/validator/)
- [Status](https://daisyui.com/components/status/)
- [Stat](https://daisyui.com/components/stat/)
- [Alert](https://daisyui.com/components/alert/)
- [Tabs](https://daisyui.com/components/tab/)
- [Migracja v5 — usunięte klasy i nowe wzorce](https://daisyui.com/docs/upgrade/)

## Po akceptacji

### Doprecyzowanie: telefon i wykresy

Pliki `obok-wyniku-mobile.html` i `obok-wyniku-desktop.html` pokazują wybrany kierunek dla wszystkich trzech kalkulatorów. Fragmenty zawierają wspólny styl z `mobile-charts.css` i zachowanie z `chart-detail.js`; są samowystarczalne w podglądzie rozmowy. To nadal mockupy, bez połączenia z backendem. Wartości pozostałych serii obligacji i punkty pośrednie są ilustracyjne, a nie obliczonym rankingiem.

- Desktop: formularz po lewej, wynik i główny wykres po prawej. W obligacjach dodatkowy wieloseryjny przebieg ma pełną szerokość pod obiema kolumnami, w niezależnie rozwijanym panelu. W celu i regularnym oszczędzaniu wykres dwóch serii mieści się przy wyniku.
- Telefon: jedna kolumna, kolejno formularz, wynik, główny wykres, panele szczegółowe. Grupa podatku jest początkowo zwinięta, z widocznym podsumowaniem ustawienia; to celowa różnica względem desktopu ograniczająca długość formularza.
- Skróty „Zobacz wynik” oraz „Zmień założenia” przewijają do odpowiedniej sekcji. Bez zasłaniającego ekran pływającego panelu.
- Poziome słupki końcowe mają etykiety i kwoty przy każdym typie obligacji. Nie wymagają obracania telefonu.
- Wykres liniowy rysuje osie dla rzeczywistej szerokości kontenera. Nie pomniejsza etykiet wraz z całym obrazem. Serie mają stałe kolory i różne wzory linii, wybór widocznych serii oraz odczyt dla wybranego roku. Odczyt działa przez natywny selektor także bez hovera.
- Przebieg obligacji jest otwarty w mockupach, żeby pokazać wygląd; docelowo może być zamknięty, zgodnie z zasadą dodatkowych szczegółów. Tabela pozostaje osobnym panelem „Szczegóły wyniku”; pełna tabela docelowa zachowa przewijanie poziome i przypiętą kolumnę roku.
- Szerokość telefonu w podglądzie: domyślnie 390 px, regulowana 320–430 px. Na węższej powierzchni dopasowuje się do dostępnego miejsca.

Kontrola DOM obu nowych mockupów przeszła dla wszystkich trzech kalkulatorów: generowanie wykresów, odczyt roku, wybór serii i stan bez zaznaczonych serii. Nie wykonano kontroli pikselowej w przeglądarce; ograniczenie opisano poniżej.

### Realizacja wybranego układu

1. Wdrożyć wybrany układ we wszystkich trzech kalkulatorach na tym branchu, bez zmian modelu obliczeń.
2. Ujednolicić opakowania sekcji, etykiety, jednostki, focus, błędy i podsumowania zamkniętych grup; zachować uprawnienia rodzinne, historię ofert, reset i pomoc IKE.
3. Zachować pełne teksty SEO i wzory w SSR; zaktualizować kontrole treści, jeśli zmienią się selektory.
4. Sprawdzić klawiaturę, czytnik ekranu, szerokości 320/390/768/1280, menu boczne, długie liczby i polskie etykiety.
5. Sprawdzić stany ładowania, nieaktualności, błędu i retry, cel pokryty kapitałem, zerową stopę, pominięcie inflacji/podatku, rodzinne serie i historyczną ofertę.
6. Uruchomić adekwatne testy, lint, build i kontrole SSR/treści; dopiero potem utworzyć PR. Publikacja produkcyjna jest osobnym etapem.

Na etapie przygotowania makiet zmieniono wyłącznie dokumentację i mockup; opisane poniżej sprawdzenia dotyczą tego historycznego etapu. Kontrole gotowej implementacji są w IMPLEMENTATION.md.

Sprawdzenie prototypu: skrypt osadzony w HTML wykonano w jsdom; sprawdzono oba układy i trzy kalkulatory, grupowanie kontrolek, zmianę podatku, uprawnienie rodzinne, pomijanie stóp, wyróżnianie tabeli i reset. `git diff --check` przeszedł. Generator podglądu poprawnie opakował fragment. Nie wykonano wizualnej kontroli w przeglądarce: narzędzie zablokowało otwarcie lokalnego adresu `file:`. Responsywność wymaga odbioru wizualnego przy wdrożeniu; test DOM nie potwierdza braku kolizji layoutu.
