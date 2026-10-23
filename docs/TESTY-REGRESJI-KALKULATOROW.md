# Testy regresji kalkulatorów — stan przed zmianami IKE/800+

Data: 23.10.2026. Testowana oferta: `2026-10-v1`, silnik obligacji w wersji 2.

## Uruchamianie

```sh
npm run test:regression
```

Ta komenda uruchamia kompilację i wszystkie testy Functions oraz testy Angulara. Nie wymaga emulatora, sieci ani wdrożenia. To podstawowa kontrola przed i po zmianach. Python nie jest zależnością zwykłego uruchamiania: oczekiwane wartości są zapisane w JSON.

Dodatkowa kontrola niezależnego rachunku i skuteczności testów:

```sh
python3 scripts/regression/generate-reference.py --check
npm run test:mutations
```

Pierwsza komenda porównuje zapisane wartości z obliczeniami Decimal, bez nadpisywania pliku. Druga kompiluje Functions, tworzy izolowaną kopię w katalogu tymczasowym i wprowadza pojedynczo celowe błędy. Kod źródłowy i właściwy build nie są modyfikowane. Po próbie kopia jest usuwana. Raport trafia do `docs/baseline/calculator-mutations.json`.

## Stan bazowy i wynik rozszerzenia

| Zestaw | Przed rozszerzeniem | Po rozszerzeniu |
| --- | --- | --- |
| Backend | 44 testy | 133 testy |
| Frontend | 38 testów w 12 plikach | 63 testy w 14 plikach |
| Łącznie | 82 | 196 |

Rozszerzenie obejmuje 89 testów backendu i 25 testów frontendu. Liczba testów nie jest miarą procentowego pokrycia ani dowodem braku wszystkich błędów.

Wykonana weryfikacja: `npm run test:regression`, oba zadania lint, niezależny rachunek `--check`, `npm run test:mutations`, produkcyjny build Angulara z `--stats-json` i `npm run check:content` — wszystkie zakończone powodzeniem. Build Angulara wykonano poza sandboxem, ponieważ proces w sandboxie kończył się bez diagnostyki. Nie uruchamiano wdrożenia ani testów produkcyjnego API.

## Niezależne oczekiwane wartości

`scripts/regression/generate-reference.py` nie importuje ani nie uruchamia kodu aplikacji. Generuje `functions/src/calculations/regression-reference.json`, zawierający:

- 52 punkty kontrolne obligacji: siedem typów, 1 i 100 sztuk, z podatkiem i bez podatku, zapadalność, wykup przed terminem, indeksacja przy zerowej inflacji, ACT/ACT w roku przestępnym i oprocentowanie wypłaconej gotówki.
- 8 przykładów regularnych wpłat: zerowa i dodatnia stopa, kwoty z groszami, okres do 100 lat i oba ustawienia podatku.
- 8 przykładów oszczędzania na cel: inflacja, zaokrąglenie wymaganej wpłaty, zerowy zwrot, okres do 100 lat i oba ustawienia podatku.

Obligacje są liczone analitycznie dla wybranych terminów, bez odtwarzania miesięcznej pętli produkcyjnego symulatora. Przykładowo kapitał EDO w zapadalności to zaokrąglone na sztukę `100 × 1,0535 × 1,055^9`, następnie podatek od łącznego dochodu całego zakupu. Kupony są liczone osobno od nominału, z podatkiem od każdej wypłaty. Kwoty wykorzystują Decimal z precyzją 70 cyfr; pieniądze zaokrąglamy half-up, podatek obligacji w górę do grosza.

Dla oszczędzania źródłem odniesienia jest suma wartości każdej miesięcznej wpłaty na koniec miesiąca. Produkcja stosuje wzór zamknięty renty; skrypt referencyjny sumuje poszczególne przepływy. W celu wymagane wpłaty wynikają z sumy wag kapitału i wzrostu po podatku, a po zaokrągleniu wpłaty wykonywany jest rachunek w przód.

Parametry emisji są celowo zamrożone w skrypcie, niezależnie od aktualnego JSON aplikacji. Pochodzenie i hashe siedmiu listów emisyjnych znajdują się w `docs/baseline/2026-10-21-stage2-offer-sources.json`. Bieżącą charakterystykę produktów można sprawdzić w [oficjalnej tabeli oferty](https://www.obligacjeskarbowe.pl/oferta/); szczegóły zaokrągleń i dat wynikają z konkretnych listów podlinkowanych w manifeście.

Nie aktualizujemy oczekiwań na podstawie odpowiedzi `calculate()` ani wyniku produkcyjnego API. Zmiana oferty powoduje jawny błąd wersji i wymaga osobnego przeglądu parametrów oraz przykładów. Przy późniejszym rozdzieleniu profili od mechanizmu należy zachować historyczne przykłady październikowe jako niezależne wejścia do silnika; nowe emisje dostają własne przykłady.

## Co sprawdzają poszczególne warstwy

| Warstwa | Sprawdzane zachowanie |
| --- | --- |
| Obliczenia | Kwoty kapitału, kuponów, podatku, opłat i gotówki; zapadalność; kapitalizacja; właściwy poprzedni rok indeksacji; zaokrąglenie na sztukę przed skalowaniem |
| Orkiestracja obligacji | Niezależnie sprawdzona kwota konkretnego produktu trafia do właściwego pola porównania |
| HTTP Functions | Rzeczywiste handlery, parsowanie parametrów, JSON odpowiedzi, liczby, błędy 400 i zgodność ze starym klientem |
| Benchmark | Inflacja zerowa i ujemna, brakujący kolejny rok, kompletne i uporządkowane miesiące |
| Klienci Angular HTTP | Procenty zamienione na ułamki, pomijanie inflacji/stopy bez utraty preferencji, oba ustawienia podatku, tablice scenariuszy, wersje oferty i silnika |
| Prezentacja | Ta sama kwota i właściwy instrument w tabeli oraz obu wykresach; pełne rocznice; końcowy rok; podatek w etykietach; benchmark poza rankingiem; poprawne ROS/ROD |
| Ranking | Każdy z siedmiu typów może zostać zwycięzcą; wcześniejszy lepszy wynik i wyższy benchmark nie wygrywają rankingu końcowego |
| Cykl widoku | Przeliczenie aktualizuje istniejące wykresy, usunięcie widoku je niszczy, odbiorcy nie zmieniają danych odpowiedzi |
| Istniejące testy | Nadal obejmują m.in. dyskonto zamiany, resztę gotówki, niekupowanie po ostatniej wycenie, ograniczenia i walidację, localStorage, debounce oraz anulowanie żądań |

W testach wykresów zastąpiony jest tylko renderer Chart.js. Właściwe komponenty, szablony, efekty i budowanie zbiorów danych wykonują się normalnie. Nie jest to test pikseli canvas ani wyglądu na prawdziwym urządzeniu. Testy handlerów HTTP nie uruchamiają infrastruktury Firebase ani CORS; do tego pozostają istniejące skrypty smoke na emulatorze.

## Próba celowych regresji

Zestaw wykrył 14 z 14 wybranych mutacji w tym stanie kodu:

1. Zaokrąglanie podatku obligacji w dół.
2. Ignorowanie pominięcia podatku obligacji.
3. Usunięcie opłaty wykupu.
4. Niewłaściwa podstawa podatku przed odjęciem opłaty.
5. Usunięcie kapitalizacji.
6. Dwukrotne dodanie kuponu.
7. Pominięcie odsetek od gotówki.
8. Użycie inflacji o rok za wcześnie.
9. Usunięcie dyskonta zamiany.
10. Pominięcie ostatniego miesiąca.
11. Uznanie zerowego scenariusza za brak danych.
12. Przesunięcie regularnej wpłaty na początek miesiąca.
13. Ignorowanie braku podatku w oszczędzaniu na cel.
14. Ignorowanie braku podatku przy regularnych wpłatach.

To celowana próba istotnych błędów, nie pełne badanie wszystkich mutacji. Każda próba zaczyna się od przechodzącego niezmienionego buildu. Skrypt sprawdza unikalność miejsca zmiany i prawidłowy raport Mocha, żeby awaria uruchomienia nie uchodziła za wykryty błąd. Po zmianie układu kodu kotwice mutacji mogą wymagać dostosowania; ich brak zatrzymuje próbę zamiast ją cicho pomijać.

## Zasady następnego etapu

Ten etap nie implementuje IKE, filtrów rodzinnych ani nowego silnika. Istniejące `skipTax` ma już sprawdzone zachowanie, do którego później podłączymy uproszczone IKE.

Podczas wdrożenia dodajemy osobne testy nowego zachowania: macierz IKE/800+, odtwarzanie preferencji i usuwanie niedostępnych typów także z rankingu. Świadoma zmiana domyślnej listy produktów wymaga aktualizacji testu tego zachowania, nie zmiany niezależnych oczekiwań finansowych. Stary kontrakt API i historyczne kwoty pozostają chronione.

Nowe testy wykryły również dotychczasowy problem typowania Chart.js po włączeniu komponentu liniowego do kompilacji testowej. Jedyna zmiana wykonywalnego źródła aplikacji w tym etapie to doprecyzowanie generyków wykresu liniowego: `Chart<"line", number[], number>`. Nie zmienia obliczeń ani działania wykresu.
