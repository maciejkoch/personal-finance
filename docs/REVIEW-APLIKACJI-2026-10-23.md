# Review całej aplikacji Oszczędzify

Data: 23.10.2026. Gałąź: `codex/ike-family-bond-options`.
Oceniany commit: `2a186429211c49867d586d3f5d8bd5ec1b75ed04`, zgodny z gałęzią zdalną w chwili kontroli.

## Realizacja po decyzjach z 24.10.2026

Uzgodniono uproszczenie do opcji „Pomiń podatek Belki”; IKE pozostaje wyłącznie w treści wyjaśnień, bez przykładów. R1/R2 nie są realizowane jako pełny model produktu. R8 rozszerzono do dodania kapitału początkowego (domyślnie 0 zł) w obu kalkulatorach. Starsze ustawienia są odrzucane na rzecz domyślnych. R3–R7 oraz K1–K6 objęto implementacją w uzgodnionym zakresie. Aktualny opis zmian i weryfikacji znajduje się w `docs/REVIEW-WDROZENIE-2026-10-24.md`. Poniższe ustalenia i estymacje opisują stan pierwotnie ocenianego commita.

## Ocena

**Aplikacja ma dobrą bazę techniczną, ale tryb nazwany IKE wymaga poprawienia przed traktowaniem jego rankingu jako porównania rzeczywistych wariantów IKE-Obligacje.** Zwykłe scenariusze oszczędzania są matematycznie spójne z opisaną metodą. Nie wszystkie poprawnie zwalidowane dane dają jednak poprawny wynik.

Zidentyfikowałem **8 usterek: 2 × P1, 5 × P2, 1 × P3**. P1 oznacza poprawkę przed publikacją funkcji jako wiarygodnego modelu produktu; P2 — istotną poprawkę funkcjonalną lub informacyjną; P3 — mniejszą niespójność. Nie znalazłem problemu P0.

| ID | Priorytet | Problem | Potwierdzenie |
| --- | --- | --- | --- |
| R1 | P1 | IKE łączy brak podatku z opłatą za wykup, bez rozróżnienia rodzaju zakończenia oszczędzania | Kod, uruchomienie silnika, oficjalne zasady |
| R2 | P1 | Kupony w IKE nie są reinwestowane zgodnie z DNOS; można naliczać oprocentowanie gotówki | Kod i dokumentacja operatora |
| R3 | P2 | Etykieta IKE nie wyjaśnia warunków zwolnienia i limitu wpłat | Formularze, kod, źródła |
| R4 | P2 | Bardzo mała dodatnia stopa zeruje kapitał i daje ujemny podatek | Powtarzalne uruchomienie silnika |
| R5 | P2 | Brak górnego limitu kwoty dopuszcza przepełnienie i `null` w odpowiedzi | Walidator i silnik |
| R6 | P2 | Stare wyniki pozostają widoczne przy nowych założeniach i błędzie przeliczenia | Analiza przepływu stanu i szablonów |
| R7 | P2 | Błąd pobrania artykułu daje pustą stronę bez komunikatu i ponowienia | Analiza store i szablonu |
| R8 | P3 | Strona główna obiecuje kapitał początkowy, którego kalkulator nie obsługuje | Treść i formularz |

Układ raportu zaktualizowano 24.10.2026. Podział nie zmienia ustaleń ani ocenianej wersji kodu. Zachowano identyfikatory R1–R8 i K1–K6, aby nie zmieniać wcześniejszych odwołań.

| Część | Zakres | Usterki i rekomendacje |
| --- | --- | --- |
| 1. Treść | Opisy, etykiety, obietnice funkcji i wyjaśnienia ograniczeń | R3, R8, K5 |
| 2. Działanie i kalkulatory | Reguły finansowe, formularze, wyniki, błędy i dostępność treści | R1, R2, R4, R5, R6, R7 |
| 3. Kod | Architektura, kontrakty, testy, CI, utrzymanie i ochrona API | K1, K2, K3, K4, K6 |

Każdy punkt ma jedno główne miejsce. Przykładowo R7 dotyczy działania strony artykułu, a nie jakości jego tekstu; K1 opisuje architekturę potrzebną do poprawek finansowych R1/R2. Estymacje obejmujące wspólne prace nie sumują się wprost.

### Jak czytać estymacje

Estymacja dotyczy zakresu opisanego w tym raporcie i ocenianego commita. To orientacyjny nakład pracy jednego programisty znającego Angular i TypeScript, obejmujący implementację, odpowiednie testy i lokalną weryfikację. **1 dzień = 8 godzin pracy.** Nie jest to deklaracja czasu wykonania przez agenta. Widełki nie obejmują oczekiwania na decyzje produktowe, zewnętrzną opinię prawną, akceptację ani wdrożenie. Późniejsze zmiany kodu mogą wpłynąć na koszt integracji.

Skala złożoności: **1/5 — kosmetyczna**, **2/5 — lokalna**, **3/5 — kilka warstw aplikacji**, **4/5 — zmiana modelu domenowego**, **5/5 — przebudowa silnika z wieloma zależnymi regułami**. Złożoność jest niezależna od priorytetu: mała poprawka może usuwać ważny błąd.

## 1. Treść

Opisy, nazwy opcji, spójność obietnic z możliwościami aplikacji oraz sposób prezentowania znaczenia kwot. Zmiany w tej części nie zastępują naprawy reguł obliczeniowych IKE z części 2.

### R3 — P2: doprecyzować warunki i ograniczenia opcji IKE

Lokalizacja: [wspólna kontrolka podatku](</Users/maciejkoch/PRV projects/oszczdzify/src/app/features/calculators/shared/tax-options/tax-options.component.html:30>), [walidacja liczby obligacji](</Users/maciejkoch/PRV projects/oszczdzify/src/app/features/calculators/treasury-bonds/model/treasury-bonds-form-state.ts:5>).

Formularz obligacji komunikuje tylko brak podatku po zaznaczeniu IKE. Dwa pozostałe formularze mają jedną etykietę „Pomiń podatek Belki / symuluj IKE”. Brakuje warunków wypłaty i informacji o limicie wpłat, choć kwoty mogą być dowolnie wysokie w granicach technicznych.

Zwolnienie wymaga spełnienia ustawowych warunków wieku i historii wpłat; nie wynika z samego posiadania konta. Limit wpłat w 2026 r. to **28 260 zł**. Wpływy z wykupu i odsetki nie zużywają tego limitu. [Opis IKE](https://www.obligacjeskarbowe.pl/ike/), [limit u operatora](https://www.bm.pkobp.pl/pomoc/pytania-i-odpowiedzi/ike-i-ikze).

Minimum: informacja przy przełączniku, że model zakłada spełnienie warunków zwolnienia, pomija limit i nie sprawdza uprawnienia. Nie należy mechanicznie ograniczać wartości całego portfela do rocznego limitu: może pochodzić z wcześniejszych lat lub transferu. Przy modelowaniu nowych wpłat należy rozróżnić ich źródło i rok.

Koszty prowadzenia IKE są wyłączone w rozwijanym opisie, lecz wyniki mówią ogólnie „po opłatach”. Zmienić etykietę na „po modelowej opłacie za wykup, bez kosztów prowadzenia IKE”, jeżeli te koszty pozostaną pomijane. To uczciwie opisze zakres wyniku.

### R8 — P3: usunąć obietnicę obsługi kapitału początkowego

Lokalizacja: [karta na stronie głównej](</Users/maciejkoch/PRV projects/oszczdzify/src/app/features/home/home.component.html:51>).

Karta kalkulatora celu mówi o wpływie kapitału początkowego. Formularz i backend nie mają tego parametru; metodologia i strona „O nas” wprost opisują start od zera. Najmniejsza poprawka to usunięcie tej obietnicy. Dodanie rzeczywistego kapitału początkowego byłoby osobnym rozszerzeniem wzoru, formularza, API i testów.

### K5 — Doprecyzować komunikację wyników

Wykresy wpłat są brutto, podsumowanie regularnych wpłat netto. Metodologia to wyjaśnia; warto mieć etykietę brutto/netto także bezpośrednio przy każdej kwocie. W opisie obligacji „początkowa kwota będzie miała wartość nominalną” zastąpić „do zachowania siły nabywczej potrzeba…”.

### Estymacje — treść

| ID | Złożoność | Nakład | Co obejmuje i skąd trudność | Zależności i ryzyko regresji |
| --- | --- | --- | --- | --- |
| R3 | **2/5 — niska** | **0,5–1 dzień** | Informacja o warunkach zwolnienia, pomijanym limicie i kosztach rachunku, spójne etykiety we wszystkich trzech kalkulatorach oraz kontrola treści po prerenderze. | Tekst musi odpowiadać decyzji z R1. **Niskie ryzyko techniczne**, średnie ryzyko nieprecyzyjnego opisu. To wyjaśnienie ograniczeń, nie implementacja walidacji uprawnienia do IKE. |
| R8 | **1/5 — kosmetyczna** | **0,5–1 godzina** | Usunięcie obietnicy kapitału początkowego i sprawdzenie spójności karty z opisem narzędzia. | Niezależne. **Niskie ryzyko.** Estymacja dotyczy korekty treści, a nie dodania nowej funkcji. |

| ID | Rekomendacja | Złożoność | Nakład | Zależności, ryzyko i nakładanie się prac |
| --- | --- | --- | --- | --- |
| K5 | Etykiety brutto/netto i opis siły nabywczej | **2/5 — niska** | **0,5–1 dzień** | Ujednolicenie podsumowań, wykresów, tooltipów i opisów bez zmiany obliczeń; kontrola wizualna. Częściowo wspólne z R3. **Niskie ryzyko**, jeżeli etykiety wynikają z rzeczywistego wariantu podatku. |

### Warianty i dodatkowe zalecenia — treść

| Zakres | Złożoność i nakład | Granice estymacji |
| --- | --- | --- |
| Tymczasowe przedstawienie IKE wyłącznie jako scenariusza bez podatku | **2/5; 0,5–1 dzień** | Spójna zmiana etykiet, opisów i obietnic funkcji, z kontrolą zachowania filtrowania instrumentów. Ogranicza ryzyko komunikacyjne R1–R3; **nie realizuje modelu IKE** i nie zastępuje późniejszych poprawek. |
| Powtórzenie ostrzeżenia o limicie rodzinnym przy wyniku | **1/5; 1–2 godziny** | Warunkowy komunikat dla porównania obejmującego ROS/ROD i kontrola widoczności; nie waliduje historii świadczeń. |

## 2. Działanie i kalkulatory

Poprawność modelu finansowego i wyników, zachowanie formularzy oraz obsługa ładowania, błędów i ponawiania żądań.

### R1 — P1: rozdzielić wypłatę z IKE, zwrot i wartość pozostającą na rachunku

Lokalizacja: [naliczanie opłaty](</Users/maciejkoch/PRV projects/oszczdzify/functions/src/treasury-bonds/bond-simulation.ts:113>), [przekazywanie parametrów](</Users/maciejkoch/PRV projects/oszczdzify/functions/src/treasury-bonds/treasury-bonds.ts:33>), [reguła podatkowa](</Users/maciejkoch/PRV projects/oszczdzify/functions/src/markets/pl/polish-calculator-options.ts:7>).

`ike=true` zamienia się na `skipTax=true`; do silnika nie trafia informacja o rodzaju zakończenia IKE. Opłata za wcześniejszy wykup pozostaje taka jak poza IKE. Dla wypłaty spełniającej warunki oraz wypłaty transferowej operator nie potrąca opłaty z listu emisyjnego. Zwrot przed spełnieniem warunków podlega natomiast podatkowi i opłacie. [Zasady IKE-Obligacje](https://www.obligacjeskarbowe.pl/ike/).

**Przykład:** 100 EDO, 12 miesięcy, IKE, gotówka oprocentowana 0%. Silnik zwraca **10 235 zł**. Po roku nominalne 10 000 zł plus 5,35% daje **10 535 zł** przed ewentualnymi kosztami prowadzenia rachunku. Różnica 300 zł to opłata wykupu, która nie powinna wystąpić w wariancie kwalifikowanej wypłaty. W obecnym rankingu jednorocznym ROR daje 10 396 zł i wyprzedza EDO; sama korekta rodzaju wypłaty zmienia to porównanie. To przykład skutku konkretnej reguły, nie pełna wycena IKE ani rekomendacja.

Jeśli wynik ma opisywać wartość wewnątrz rachunku, należy tak go nazwać i odróżnić od pieniędzy do wypłaty. Jeśli ma opisywać zakończenie oszczędzania, potrzebny jest jawny wariant zakończenia. Test akceptacyjny: te same EDO dają różne rozliczenia dla wypłaty kwalifikowanej, transferu i zwrotu; odznaczenie podatku poza IKE nie usuwa automatycznie opłaty.

### R2 — P1: w IKE kupony muszą tworzyć nowe partie obligacji

Lokalizacja: [oprocentowanie gotówki](</Users/maciejkoch/PRV projects/oszczdzify/functions/src/treasury-bonds/bond-simulation.ts:59>), [kupon trafiający do gotówki](</Users/maciejkoch/PRV projects/oszczdzify/functions/src/treasury-bonds/bond-simulation.ts:99>), [zakup dopiero przy zapadalności](</Users/maciejkoch/PRV projects/oszczdzify/functions/src/treasury-bonds/bond-simulation.ts:130>).

Kod odkłada kupony ROR/DOR/COI do `cash`, a nowe obligacje kupuje dopiero po zapadalności pierwotnej partii. W IKE-Obligacje wpływy, w tym odsetki, służą automatycznym zakupom według DNOS. Wolna gotówka na rachunku emerytalnym nie jest oprocentowana. [FAQ operatora](https://www.bm.pkobp.pl/pomoc/pytania-i-odpowiedzi/ike-i-ikze), [regulamin, rozdziały 4–5](https://www.obligacjeskarbowe.pl/regulamin/).

**Przykład:** 1000 ROR daje przy 4% pierwszy kupon 330 zł brutto według przyjętego zaokrąglenia. Silnik trzyma całe 330 zł w gotówce do rocznej zapadalności, zamiast uwzględnić możliwość automatycznego nabycia trzech nowych sztuk już po kuponie. Ich wiek, kolejne kupony i daty wykupu będą inne niż pierwotnej partii. Dodatkowo pole oprocentowania gotówki pozostaje aktywne w trybie IKE, a naliczony od niej dochód także korzysta z `skipTax`.

Potrzebny jest model partii zakupowych i strategia DNOS, osobna od symulacji zwykłego rachunku. Alternatywnie do czasu wdrożenia nazwać opcję wyłącznie „symulacją bez podatku”, bez deklaracji odwzorowania IKE-Obligacje. Test: kupon wystarczający na pełną obligację powiększa portfel w miesiącu wypłaty, a niewydana reszta nie zarabia odsetek.

### R4 — P2: niestabilny numerycznie wzór dla stóp bliskich zeru

Lokalizacja: [wartość serii](</Users/maciejkoch/PRV projects/oszczdzify/functions/src/calculations/calculations.service.ts:46>), [wyliczenie wpłaty](</Users/maciejkoch/PRV projects/oszczdzify/functions/src/calculations/calculations.service.ts:18>), [podatek](</Users/maciejkoch/PRV projects/oszczdzify/functions/src/calculations/calculations.service.ts:62>).

`Math.pow(1 + rate / 12, n) - 1` traci precyzję, kiedy dodatnia stopa jest bliska zeru. Walidator dopuszcza takie wartości; ścieżka specjalna obejmuje wyłącznie dokładne zero.

**Reprodukcja:** `regular.calculate(1000, 1, 1e-16)` zwraca wpłaty 12 000 zł, kapitał **0 zł**, odsetki **−12 000 zł** i podatek **−2280 zł**. Poprawny wynik powinien być praktycznie równy 12 000 zł. Dla celu 12 000 zł ten sam przypadek wylicza wpłatę **5263,16 zł miesięcznie** zamiast około 1000 zł. Stopa `1e-16` jest wartością API; formularz pokazuje procenty.

Zastosować stabilny współczynnik renty, np. `Math.expm1(n * Math.log1p(i)) / i`, z granicą dla zera. Podatek nie może tworzyć ujemnej należności. Dodać testy ciągłości przy zerze i niezmiennika: dla nieujemnej stopy wynik brutto nie jest mniejszy od sumy wpłat. Zwykłe stopy przechodzą kontrolę; to błąd brzegowy, nie dowód niepoprawności wszystkich wyników.

### R5 — P2: ograniczyć kwoty i kontrolować skończoność wyników

Lokalizacja: [DTO wpłat](</Users/maciejkoch/PRV projects/oszczdzify/functions/src/regular-contributions/regular-contributions.dto.ts:6>), [DTO celu](</Users/maciejkoch/PRV projects/oszczdzify/functions/src/savings/savings.dto.ts:6>), serwisy obu kalkulatorów oraz ich formularze.

Kwota ma ograniczenie dodatniości, ale nie ma maksimum. `1e308` jest skończoną liczbą i przechodzi walidację. Dla 100 lat i stopy 1 silnik przepełnia obliczenia; serializacja JSON zamienia `Infinity`/`NaN` na **`null`**. Odpowiedź narusza oczekiwany kontrakt liczbowy, zamiast odrzucić niemożliwy scenariusz.

Ustalić sensowny limit biznesowy po obu stronach, sprawdzać wynik przed odpowiedzią i zwracać kontrolowany błąd walidacji. Samo `.finite()` na wejściu nie zapobiega przepełnieniu podczas mnożenia. Testować największą dopuszczoną kwotę ze skrajnym okresem/stopą oraz odrzucenie kwoty ponad limit.

### R6 — P2: oznaczać nieaktualne wyniki i błąd przy formularzu

Lokalizacja: [store regularnych wpłat](</Users/maciejkoch/PRV projects/oszczdzify/src/app/features/calculators/regular-contribution/store/regular-contribution.store.ts:32>), analogiczny [store celu](</Users/maciejkoch/PRV projects/oszczdzify/src/app/features/calculators/long-term-savings/store/long-term-savings.store.ts:32>), oba szablony stron.

Nowe poprawne żądanie ustawia `request` i `isLoading`, lecz zachowuje poprzedni `result`. W przypadku błędu wynik nadal pozostaje. Szablony tych dwóch kalkulatorów nie pokazują `isLoading`, a alert błędu umieszczają dopiero za długą metodologią. Zmiana kwoty lub stopy nie unieważnia wyniku tak jak zmiana opcji podatkowych.

**Scenariusz:** policz 500 zł miesięcznie, zmień na 1000 zł, a drugie żądanie niech zakończy się HTTP 500. Formularz zostaje przy 1000 zł, widoczny wynik przy 500 zł; komunikat awarii może być poza ekranem. W podsumowaniu jest stara kwota, więc nie jest to podmiana metadanych odpowiedzi, ale interfejs nie oznacza wyniku jako nieaktualnego.

Oznaczyć „wynik dla poprzednich ustawień”, pokazać aktualizowanie i błąd obok wyniku albo usuwać poprzednie dane. Dodać przycisk ponowienia bez konieczności zmiany pola. Test akceptacyjny: sukces A → zmiana założeń → oczekiwanie B → błąd B, z asercją na widocznym stanie komponentu. Ustalenie pochodzi z kodu; nie symulowałem awarii sieci w przeglądarce.

### R7 — P2: obsłużyć awarię pobierania artykułów w interfejsie

Lokalizacja: [ArticleStore](</Users/maciejkoch/PRV projects/oszczdzify/src/app/features/articles/article/store/article.store.ts:29>), [szablon artykułu](</Users/maciejkoch/PRV projects/oszczdzify/src/app/features/articles/article/article.component.html:1>).

Store tylko loguje błąd do konsoli. Szablon wyświetla treść wyłącznie przy niepustym `content`; nie ma komunikatu błędu, loadera ani przycisku ponowienia. Przy wejściu z nawigacji aplikacji i nieudanym pobraniu artykułu użytkownik otrzymuje pusty obszar strony. Bezpośrednie wejście na poprawnie prerenderowany artykuł może działać dzięki TransferState — to nie usuwa awarii późniejszej nawigacji HTTP.

Dodać jawne stany ładowania i błędu oraz ponowienie. Test: utworzenie komponentu → błąd API → widoczny komunikat → retry → treść. Ustalenie statyczne, nie odtworzenie awarii produkcyjnej.

### Co jest poprawne i jakie uproszczenia są dopuszczalne

- **Wzory regularnych wpłat i celu:** odpowiadają rencie płatnej z dołu z nominalną stopą roczną dzieloną przez 12, miesięczną kapitalizacją i końcowym podatkiem. Przykłady 12 480,30 zł netto oraz 425,03 zł miesięcznej wpłaty zgadzają się z silnikiem. Cel 10 609 zł po inflacji również jest poprawny.
- **Podatek końcowy w dwóch prostych kalkulatorach:** jest uproszczeniem jawnie opisanym. Nie należy go przedstawiać jako dokładnego modelu konta oszczędnościowego z poborem podatku przy każdej kapitalizacji. Nie klasyfikuję samego uproszczenia jako błędu prawnego.
- **Oferta obligacji:** stopy pierwszego okresu 4%; 4,15%; 4,40%; 4,75%; 5,35%; 5%; 5,60% oraz marże w konfiguracji są zgodne z październikową tabelą MF. [MF: oferta w październiku 2026](https://www.gov.pl/web/finance/supply-of-treasury-securities-in-october-2026).
- **Typy obligacji:** TOS jest stałoprocentowe, ROR/DOR mają miesięczne kupony, COI roczne, EDO/ROS/ROD kapitalizację. ROS/ROD są ukrywane bez opcji rodzinnej i wykluczane w IKE. Nie znalazłem tu niezgodności w sprawdzonym zakresie.
- **Inflacja:** benchmark pełnych lat poprawnie składa inflację, a indeksacja obligacji korzysta z poprzedniego roku scenariusza i dolnego ograniczenia zera. Artykuł prawidłowo odróżnia historyczny wskaźnik GUS od przyszłej inflacji. Interpolacja benchmarku w niepełnych latach jest liniowa; UI pokazuje pełne lata, więc nie wpływa to na widoczny ranking roczny.
- **Wcześniejszy wykup poza IKE:** kod rozróżnia ochronę odsetek, wypłacony kupon i zapadalność; testy mutacyjne rzeczywiście wykrywają usunięcie opłaty, kapitalizacji i podwójny kupon. Nie potwierdza to pełnej zgodności kalendarzowej z agentem emisji.
- **Rodzinne limity, przyszłe emisje i kalendarz:** brak walidacji limitu 800+, powtarzanie dzisiejszej oferty, brak dni roboczych i rozliczenia dyspozycji są wyraźnie ujawnione. To ograniczenia scenariusza, nie ukryte usterki. Przy wysokich kwotach warto powtórzyć ostrzeżenie przy wyniku.

### Estymacje — działanie i kalkulatory

| ID | Złożoność | Nakład | Co obejmuje i skąd trudność | Zależności i ryzyko regresji |
| --- | --- | --- | --- | --- |
| R1 | **4/5 — wysoka** | **3–5 dni** | Jawny wariant: wartość rachunku, wypłata kwalifikowana, transfer lub całkowity zwrot; zmiany DTO, formularza, podatku, opłat, opisów i testów. Zwrot wymaga rozliczenia dochodu rachunku, a nie prostego włączenia podatku od każdego historycznego kuponu. | Najpierw ustalić znaczenie wyniku i połączyć projekt z R2/K1. **Wysokie ryzyko:** zmiana rankingu i rozliczeń. Zakres nie obejmuje częściowych zwrotów ani pełnej historii transferów z PPE. |
| R2 | **5/5 — bardzo wysoka** | **5–9 dni** | Partie obligacji kupowane z kuponów, osobny wiek i harmonogram każdej partii, wolna gotówka, zaokrąglenia, końcowa wycena i testy niezależnych przykładów. Nie wystarczy przenieść istniejącego zakupu poza warunek zapadalności. | Wspólny projekt z R1. **Bardzo wysokie ryzyko:** odsetki, liczba sztuk, wykup i opłaty. Estymacja zakłada DNOS 100% w dany porównywany typ, miesięczny model i dotychczasowe założenie przyszłych emisji. Dowolne proporcje DNOS i kalendarz dzienny są poza zakresem. |
| R4 | **2/5 — niska**, wrażliwa matematycznie | **0,5–1 dzień** | Wspólny stabilny współczynnik renty, przypadek zera, zabezpieczenie podatku i testy bardzo małych stóp, ciągłości oraz zgodności zwykłych scenariuszy. | Może powstać niezależnie od IKE. **Średnie ryzyko:** drobne różnice zaokrągleń w obu kalkulatorach. Samo obcięcie ujemnego podatku nie naprawia wzoru. |
| R5 | **3/5 — średnia** | **1–2 dni** | Ustalenie maksimum kwot, zgodne reguły frontend/backend, kontrola wyników przed serializacją, komunikaty oraz testy skrajnych kombinacji. | Warto połączyć z K2; decyzja o dopuszczalnym zakresie danych. **Średnie ryzyko:** odrzucenie wcześniej przyjmowanych danych lub zapisanych ustawień. |
| R6 | **3/5 — średnia** | **1–2 dni** | Stan aktualności wyniku, widoczne ładowanie i błąd, ponowienie, obsługa debounce i anulowania żądań w obu kalkulatorach, testy sekwencji sukces/błąd/retry. | Niezależne od matematyki; skoordynować z aktualnymi zmianami układu stron. **Średnie ryzyko:** wyścigi odpowiedzi i migotanie wyników. |
| R7 | **2/5 — niska** | **0,5–1 dzień** | Stan błędu i ładowania artykułu, komunikat i retry, test nawigacji po błędzie oraz kontrola zachowania prerenderu/TransferState. | Skoordynować ze zmianami komponentu artykułu. **Niskie–średnie ryzyko:** różnica zachowania między wejściem bezpośrednim i nawigacją SPA. |

### Opcjonalne rozszerzenia funkcjonalne

| Zakres | Złożoność i nakład | Granice estymacji |
| --- | --- | --- |
| Dodanie obsługi kapitału początkowego zamiast korekty R8 | **3/5; 2–4 dni** | Parametr formularza/API/storage, wkład kapitału we wzór, podatek, przypadek celu już osiągniętego, opis i testy. Jest rozszerzeniem produktu, a nie koniecznym fixem. |
| Walidacja nowych wpłat IKE zamiast samego ostrzeżenia R3 | **4/5; 2–4 dni** | Wąski zakres: rozróżnienie nowych wpłat i istniejącego kapitału/transferu, wykorzystany limit bieżącego roku oraz komunikaty. Pełne badanie uprawnień, historii konta i przyszłych limitów wymaga osobnego projektu. |

## 3. Kod

Architektura, kontrakty danych, testy, automatyzacja kontroli i utrzymanie. Zalecenia dotyczą sposobu realizacji zmian; nie zwiększają liczby ośmiu usterek opisanych w częściach 1–2.

### Mocne strony

Mocne strony: podział na features/data/store/UI, komponenty OnPush, Signal Forms, `switchMap` anulujący poprzednie żądania, ostrożny odczyt localStorage, współdzielona konfiguracja oferty, wersjonowanie kontraktu obligacji i jego walidacja runtime przez Zod. Wykresy są niszczone przy usunięciu komponentu. Artykuły są prerenderowane lokalnie, a parser Markdown nie trafia do pakietu przeglądarkowego. Testy obejmują kontrakty, reguły finansowe i mutacje, nie tylko renderowanie komponentów.

### K1 — Oddzielić produkt od polityki podatkowej

`effectiveSkipTax()` jest wygodne, ale boolean nie modeluje konta IKE. Dodać rodzaj rachunku, scenariusz zakończenia i strategię reinwestowania, bez przenoszenia polskich wyjątków do ogólnej matematyki.

### K2 — Ujednolicić kontrakty odpowiedzi

Serwisy celu i wpłat zwracają `unknown`; frontend ufa typowi przekazanemu do `HttpClient.get`, który nie jest walidacją runtime. Zastosować jawne DTO i kontrolę skończoności, analogicznie do adaptera obligacji.

### K3 — Rozszerzyć testy o niezmienniki i model produktu

Obecny test „IKE = ręczne pominięcie podatku” potwierdza implementację, ale nie zgodność IKE z regułami operatora. Potrzebne są osobne przypadki wypłaty/zwrotu/DNOS oraz scenariusze R4–R7.

### K4 — Ustalić kontrolę w CI

W checkoutcie nie ma `.github/workflows`; lokalne skrypty są dobre, ale repozytorium samo nie dowodzi wymuszenia ich przed merge. Nie sprawdzałem ustawień ochrony gałęzi ani zewnętrznego CI.

### K6 — Ograniczyć duplikację i stare fragmenty

Dwa wykresy słupkowe mają niemal identyczny kod i zakomentowane przykłady. Wspólna konfiguracja wykresu i typowany `ElementRef<HTMLCanvasElement>` ułatwią utrzymanie. To porządkowanie po poprawkach funkcjonalnych, nie blokada wydania.

### Bezpieczeństwo i ochrona API

Nie znalazłem w sprawdzonym przepływie dowodu na obejście walidacji sluga przez path traversal ani użycia `bypassSecurityTrustHtml`. To nie jest pełny audyt bezpieczeństwa. CORS ogranicza dostęp przeglądarkowy, ale nie zastępuje ochrony przed kosztowym nadużyciem publicznych endpointów; limity ruchu wymagają osobnego sprawdzenia konfiguracji środowiska.

### Estymacje — kod

Nakłady dotyczą osobnych zadań. K1/K3 częściowo zawierają się już w poprawkach funkcjonalnych, a K2 w R5; nie należy naliczać tej pracy drugi raz.

| ID | Rekomendacja | Złożoność | Nakład | Zależności, ryzyko i nakładanie się prac |
| --- | --- | --- | --- | --- |
| K1 | Oddzielenie produktu od polityki podatkowej | **4/5 — wysoka** | **2–4 dni** | Model rachunku, zakończenia i reinwestowania, granice modułów oraz migracja wywołań. Duża część zawiera się w R1/R2; nie doliczać ponownie. **Wysokie ryzyko** kompatybilności opcji i dotychczasowych scenariuszy. |
| K2 | Jawne DTO i walidacja odpowiedzi | **3/5 — średnia** | **1–2 dni** | Typy i schematy odpowiedzi dwóch kalkulatorów, walidacja po obu stronach i testy błędnych payloadów. Kontrola skończoności pokrywa się z R5. **Średnie ryzyko:** ujawnienie niezgodności starego backendu z nowym frontendem. |
| K3 | Testy niezmienników i rzeczywistych reguł produktu | **4/5 — wysoka** | **2–4 dni** | Niezależne wartości referencyjne IKE/DNOS, granice matematyczne, niezmienniki salda i scenariusze błędów. Testy akceptacyjne R1–R7 są już w ich estymacjach; ten zakres w dużej części się pokrywa. **Średnie ryzyko:** testy powielające błędne założenie zamiast je wykrywać. |
| K4 | CI i wymagane kontrole przed merge | **3/5 — średnia** | **1–2 dni** | Workflow instalacji, lint, testy, build, content check, mutacje i lokalne emulatory; następnie konfiguracja wymaganych statusów, jeśli uprawnienia pozwalają. **Niskie ryzyko dla aplikacji**, średnie dla stabilności pipeline. Nie obejmuje automatycznego deployu. |
| K6 | Usunięcie duplikacji wykresów | **2/5 — niska** | **0,5–1 dzień** | Wspólna konfiguracja, typowanie canvas, usunięcie starych komentarzy i kontrola aktualizacji/niszczenia wykresów. **Średnie ryzyko wizualne:** tooltipy, legenda i odświeżanie danych. Wykonać po zmianach funkcjonalnych. |

| Zakres | Złożoność i nakład | Granice estymacji |
| --- | --- | --- |
| Sprawdzenie ochrony publicznych endpointów przed nadużyciem | **3/5; 0,5–1,5 dnia na diagnozę** | Odczyt konfiguracji skalowania, limitów, monitoringu i kosztów. Ewentualna implementacja ochrony wymaga odrębnej estymacji po diagnozie; sama konfiguracja CORS nie rozstrzyga tego zadania. |

## Łączny nakład i zależności

**Największa niepewność dotyczy R1/R2.** Przed implementacją warto przeznaczyć 0,5–1 dnia z podanych widełek na ustalenie scenariuszy produktu i kilku ręcznie policzonych przykładów. Pełny model z dowolnym DNOS, dziennym kalendarzem, częściowymi zwrotami i historią transferów wykracza poza te szacunki.

Przy wspólnej realizacji **R1–R8 wraz z koniecznymi elementami K1/K3 szacuję 12–22 dni pracy**. To zaokrąglona suma zakresów poprawek ze wspólnym projektem i testami, bez ponownego naliczania K1/K3. Dokończenie pozostałych prac jakościowych K2/K4/K5/K6 to orientacyjnie **dodatkowe 3–6 dni**, po odjęciu części wspólnej z R3/R5. Opcjonalne warianty i dodatkowa diagnoza ochrony API nie są wliczone. Widełki zakładają zachowanie miesięcznego modelu i brak istotnych konfliktów z równoległymi zmianami.

## Kolejność prac

1. Rozstrzygnąć znaczenie trybu IKE i poprawić R1–R3; do tego czasu nie prezentować go jako pełnego modelu IKE-Obligacje.
2. Naprawić stabilność wzorów i zakresy danych, dodać testy R4–R5.
3. Poprawić aktualność wyników i obsługę awarii R6–R7.
4. Usunąć sprzeczność R8, doprecyzować brutto/netto i zakres opłat.
5. Uruchomić istniejące kontrole oraz nowe scenariusze produktu, dopiero potem oceniać gotowość do publikacji.

Raport nie wprowadza poprawek aplikacji, commita, pusha ani wdrożenia.

## Załącznik: zakres i sposób kontroli

Przegląd objął trzy kalkulatory, wspólny silnik finansowy, siedem typów obligacji, walidację HTTP i formularzy, opcje podatkowe, przechowywanie ustawień, obsługę żądań i błędów, wykresy i tabelę wyników, oba artykuły, stronę główną i „O nas”, routing, SEO, konfigurację builda i Hostingu oraz testy.

Rozpocząłem od grafu codebase-memory-mcp; odczyty źródeł uzupełniły niepełne wyniki grafu. Na początku checkout miał SHA `f17cef6` i lokalne zmiany w testach/następnie wykresach. W trakcie przeglądu zostały one niezależnie zapisane w `2a18642`. Nie zmieniałem ich. Końcowy build i weryfikację gałęzi wykonałem dla `2a18642`; działanie aplikacji nie zostało przeze mnie zmodyfikowane.

Pod koniec pracy pojawiły się kolejne niezależne, niezacommitowane zmiany nawigacji, układu kalkulatorów i artykułów oraz nowe katalogi `core/navigation` i `shared/ui/section-layout`. Nie obejmuje ich ocena commita `2a18642`; linki lokalne wskazują bieżący checkout i po dalszych zmianach numery linii mogą się przesunąć.

To przegląd kodu i modelu produktu z testami lokalnymi, nie opinia prawna ani certyfikacja bankowych rozliczeń. Nie wykonywałem wdrożenia, pełnego pentestu, audytu zależności w rejestrze, pełnej kontroli WCAG ani wszystkich kombinacji przeglądarek. Nie potwierdzam, że produkcja odpowiada tej gałęzi. Bezpośredni PDF listu EDO był niedostępny dla narzędzia WWW; parametry sprawdziłem także w publicznych materiałach MF. Nie deklaruję ponownego przeczytania wszystkich załączników siedmiu listów emisyjnych.

## Załącznik: wyniki kontroli technicznych

| Kontrola | Wynik |
| --- | --- |
| `npm run test:regression` | 145 testów backendu i 102 testy frontendu w 18 plikach — PASS |
| `npm run lint` i `npm run lint:functions` | PASS |
| `npm run build -- --stats-json` | PASS; 8 tras prerenderowanych |
| Początkowy pakiet produkcyjny | 465,55 kB; szacowany transfer 116,27 kB |
| `npm run check:content` | PASS dla 7 stron; Marked pozostaje poza JS przeglądarki |
| `npm run smoke:api -- --contracts` | PASS: 4 lokalne endpointy, walidacja i CORS |
| `npm run test:mutations` | Wykryte 14/14 celowych mutacji; bazowe 145 testów PASS |
| Niezależna miesięczna rekurencja salda | 60 scenariuszy; maksymalna różnica brutto 0,00498 zł, zgodna z zaokrągleniem do grosza |

Pierwsze wywołania HTTP/builda były ograniczone przez sandbox. Ponowione poza nim zakończyły się poprawnie; nie klasyfikuję tego jako defektu aplikacji.

W przeglądarce sprawdziłem przeliczenie regularnych wpłat: 500 zł, 2 lata, 5% daje 12 480,30 zł netto; wpisanie 1,5 roku usuwa wyniki i pokazuje błąd walidacji. Dla obligacji potwierdziłem dodanie ROS/ROD po zaznaczeniu uprawnienia oraz ich usunięcie i zablokowanie opcji rodzinnej po włączeniu IKE. Potwierdziłem też wyświetlenie rocznej tabeli i podsumowania. Otworzyłem trzeci kalkulator; jego wzory i przykład sprawdziłem w silniku. Nie wykonałem kompletnego ręcznego E2E wszystkich pól i awarii sieci. Zmieniane opcje formularzy przywróciłem do wcześniej odczytanych wartości.

Logi znajdują się w [katalogu dowodów](</Users/maciejkoch/PRV projects/oszczdzify/docs/review-2026-10-23/>). Dodatkowe przypadki odtwarza [reproduce.cjs](</Users/maciejkoch/PRV projects/oszczdzify/docs/review-2026-10-23/reproduce.cjs>), wyniki zapisano w [reproduction.json](</Users/maciejkoch/PRV projects/oszczdzify/docs/review-2026-10-23/reproduction.json>). Uruchomienie z katalogu projektu: `npm --prefix functions run build`, następnie `node docs/review-2026-10-23/reproduce.cjs`.
