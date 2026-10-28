# Plan automatycznej aktualizacji inflacji

Data: 2026-10-28. Branch: `codex/inflation-sync-plan`. Status: wdrożono na produkcję 28.10.2026. Szczegóły końcowego modelu i procedura uruchomienia: [INFLACJA-WDROZENIE.md](INFLACJA-WDROZENIE.md).

## Cel

Pobierać ostatnią opublikowaną miesięczną inflację GUS, zapisywać ją w Firestore i używać jako domyślnego założenia w kalkulatorach. Użytkownik zachowuje możliwość wpisania własnej wartości i powrotu do danych GUS przyciskiem „Ustaw aktualną: X%”.

Zakres: obligacje, cel oszczędnościowy i FIRE. Kalkulator regularnych wpłat nie ma pola inflacji i pozostaje poza zakresem. Odczyt CPI jest punktem startowym scenariusza, a nie prognozą przyszłej inflacji ani odtworzeniem historycznej indeksacji obligacji.

## Źródło i znaczenie danych

- Źródło: GUS, [Miesięczne wskaźniki cen towarów i usług konsumpcyjnych od 1982 r.](https://publikacje.new.stat.gov.pl/portal-publikacje/miesieczne-wskazniki-cen-towarow-i-uslug-konsumpcyjnych-od-1982-r), załącznik CSV odkrywany na stronie publikacji. GUS udostępnia tam także XLSX; nie parsować PDF ani artykułów prasowych.
- Wybierać serię „Analogiczny miesiąc poprzedniego roku = 100”, Polska, ogółem. Pomijać zmianę miesiąc do miesiąca, średnioroczną i okres narastający.
- Korzystać z regularnej tabeli miesięcznej; szybki szacunek jest poza zakresem pierwszego wydania. Przed implementacją potwierdzić oznaczenia ewentualnych danych wstępnych w rzeczywistym pliku i zapisać regułę ich rozpoznawania w testach.
- Przeliczenie: `ratePercent = indexValue - 100`, z dokładnością źródła; np. 103,2 → 3,2%, 99,5 → −0,5%. W API kalkulatorów pozostaje dotychczasowa jednostka ułamkowa, np. 0,032.
- „Aktualna” oznacza najnowszy dostępny miesiąc pomiaru, nie bieżący miesiąc kalendarzowy. W interfejsie zawsze podać okres danych.
- Nie utrwalać adresu konkretnego załącznika z datą w ścieżce. Ograniczyć dozwolone hosty i przekierowania do zweryfikowanych oficjalnych hostów GUS.

Strona GUS potwierdza dostępność CSV i wymaganej podstawy wskaźnika. Układ bajtowy CSV, kodowanie, separator, oznaczenia braków i stabilność odkrywania załącznika wymagają pobrania rzeczywistej próbki przed napisaniem parsera. Ten plan nie deklaruje gotowego, przetestowanego integratora.

## Punkty integracji w repozytorium

- `functions/src/index.ts`: `syncBondOffers` korzysta z Functions v2 `onSchedule`, regionu `europe-central2`, harmonogramu 08:00/20:00 w Warszawie, flagi środowiskowej i logów sukcesu/błędu. Powielić wzorzec operacyjny w osobnej funkcji `syncInflation`.
- `functions/src/bond-offers/repository.ts`: dostęp do Firestore przez Admin SDK i `BOND_DATABASE_ID`. Wydzielić współdzielony inicjalizator bazy z zachowaniem tej konfiguracji, aby inflacja trafiała do tej samej instancji bez zależności domenowej od ofert obligacji.
- `functions/src/bond-offers/importer.ts`: wzór ograniczonego transportu, hashy, audytu i zapisu. Nie używać bezpośrednio `fetchSource`, bo dopuszcza wyłącznie host obligacji.
- `firestore.rules`: istniejąca odmowa wszystkich bezpośrednich operacji klientów obejmie też nowe kolekcje; odczyt przez HTTP, zapis wyłącznie backendowy.
- Obligacje: `model/treasury-bonds-form-state.ts` oraz `ui/treasury-bonds-form/treasury-bonds-form.component.{ts,html}`. Obecna stała to 3,5%, formularz przechowuje dane w localStorage i ma reset.
- Cel: `long-term-savings/ui/long-term-savings-form/long-term-savings-form.component.{ts,html}`. Obecna stała to 3,5%, localStorage ma wersjonowany schemat. Backend `functions/src/savings/savings.dto.ts` odrzuca obecnie deflację.
- FIRE: `fire/fire.model.ts` i `fire/fire.component.{ts,html}`. Obecna stała to 2,5%, wyniki przeliczają się lokalnie, reset używa `FIRE_DEFAULTS`.
- Angular 22.2, Signal Forms i istniejące stores. Zachować tę architekturę; wspólny serwis danych i komponent informacji/przycisku, bez nowego systemu formularzy.

## Model danych i zapis

Nowy moduł `functions/src/inflation/` oraz współdzielony kontrakt Zod w `functions/src/contracts/inflation.ts`:

- `inflationReadings/{readingId}`: niezmienna rewizja odczytu. Pola: `schemaVersion`, `series: PL_CPI_ALL_YOY`, `period: YYYY-MM`, `indexValue`, `ratePercent`, `sourcePageUrl`, `sourceFileUrl`, `sourceSha256`, `fetchedAt`, `parserVersion`, opcjonalne `publishedAt` tylko gdy podane w źródle.
- `inflationCatalog/current`: wskazanie dopuszczonej rewizji i dane potrzebne do jednego odczytu API. Aktualizowane transakcyjnie razem z publikacją rewizji. Starszy okres nigdy nie zastępuje nowszego.
- `inflationImportStatus/current`: ostatnia próba, ostatni sukces, rezultat `updated/unchanged/failed`, błąd i identyfikator danych. `checkedAt` nie oznacza nowej publikacji CPI.
- Prywatny snapshot CSV pod `inflation-sources/{sha256}.csv` w skonfigurowanym bucketcie; niezmienny zapis jak dla źródeł obligacji. Ponownie wykorzystać istniejący bucket po sprawdzeniu konfiguracji i IAM.

ID rewizji wynika z okresu i kanonicznych danych ekonomicznych, bez czasu pobrania. Identyczne sprawdzenie nie tworzy nowej rewizji. Zmiana pliku bez zmiany danych aktualizuje audyt źródła. Korekta tego samego miesiąca tworzy nową rewizję. Transakcja oraz serializacja importów/lease muszą chronić przed cofnięciem korekty przez spóźnione równoległe pobranie. Historyczny import domyślnie nie aktywuje bieżącego wskaźnika. Osobne narzędzie administracyjne umożliwia wycofanie błędnej rewizji i aktywację zweryfikowanej poprzedniej bez usuwania historii.

## Importer i harmonogram

1. Pobrać stronę publikacji, znaleźć właściwy CSV, pobrać go z timeoutem, limitem rozmiaru i ograniczonym retry. Archiwizować źródło przed publikacją.
2. Rozpoznać strukturę i konkretną serię po nagłówkach/etykietach, nie po przypadkowym numerze wiersza. Obsłużyć polski przecinek, BOM/kodowanie, puste przyszłe miesiące, zmianę roku, zero i wartości ujemne. Nie zastępować braków zerem.
3. Walidować jednoznaczność serii, okres, zgodność jednostek i skończoność wartości; odrzucić przyszły miesiąc i nieznany układ. Zakres obsługi kalkulatorów: −99% do 100%; wyjście poza ten zakres wymaga przeglądu, bez obcinania wskaźnika.
4. Opublikować najnowszy poprawny odczyt i jego rewizje transakcyjnie. Przy błędzie zachować ostatni poprawny odczyt, zapisać status i zgłosić błąd funkcji.
5. `syncInflation`: codziennie 08:00 i 20:00 `Europe/Warsaw`, Warszawa, maksymalnie dwa ponowienia, `maxInstances: 1` oraz ochrona repozytorium przed nakładaniem. Nowa publikacja będzie widoczna po następnym udanym sprawdzeniu; harmonogram oddzielny od obligacji.
6. Flaga `INFLATION_IMPORT_ENABLED=false` do czasu pierwszego kontrolowanego importu. CLI z dry-run domyślnie, jawne `--write`, wskazaniem projektu i wsparciem emulatora.
7. Logi `INFLATION_IMPORT_SUCCEEDED/FAILED`; alert błędu i braku udanego sprawdzenia przez 26 godzin. Osobny alert, gdy najnowszy okres jest starszy niż 2 miesiące kalendarzowe. Brak codziennej zmiany wartości CPI jest normalny.

## API odczytu

Nowa funkcja HTTP `inflationWarsaw` (GET), z istniejącym CORS, App Check i nagłówkiem buildu. Odczytuje bazę, nigdy GUS w czasie żądania klienta.

Kontrakt: `schemaVersion`, `readingId`, `period`, `ratePercent`, źródło oraz niezależne `dataStale` i `syncStale`, wyliczane z okresu odczytu i ostatniego sukcesu. Na początek `Cache-Control: no-store`, jeden współdzielony odczyt w aplikacji i jawne ponowienie po błędzie. Brak danych lub niedostępność bazy: 503; istniejący stary odczyt: 200 z oznaczeniem stanu. Dodać endpoint do konfiguracji lokalnej, staging i produkcyjnej.

Obliczenia nadal dostają jawną wartość inflacji z formularza. Backend nie podmienia jej podczas symulacji na najnowszą z bazy. Dotychczasowe kontrakty obliczeniowe obligacji pozostają zgodne.

## Wartość domyślna i ręczna zmiana

Wspólny stan danych: `loading/ready/error`, ostatni odczyt i metadane. Każdy formularz ma własny tryb `current/custom`, niezależny od ogólnego stanu dirty formularza.

1. Nowy formularz startuje w `current`; po odczycie przyjmuje wartość GUS. Zmiana pozostałych pól nie wyłącza tego trybu. Ręczna edycja inflacji, również wyczyszczenie pola lub wpisanie takiej samej liczby, ustawia `custom`.
2. Spóźniona odpowiedź API nie nadpisuje `custom`. W `current` kolejny odczyt może zaktualizować wartość i przeliczyć wynik przez obecną ścieżkę formularza. Wynik zawsze opisuje faktycznie użyte założenie.
3. W localStorage zapisywać tryb, a dla `custom` własną wartość. W `current` zapisana liczba może być tylko cache z okresem/ID, nie trwałą wartością domyślną.
4. Migracja starych zapisów: wszystkie istniejące wartości inflacji potraktować jako `custom`, ponieważ nie wiadomo, czy użytkownik zmieniał dawną stałą. Nie wymazywać pozostałych ustawień. Brak zapisu oznacza `current`.
5. Przy polu pokazać „Inflacja GUS: X% r/r, [miesiąc rok]” i link do źródła. Przy ręcznej wartości pokazać „Ustaw aktualną: X%”. Przycisk `type=button`, poza etykietą pola, z obsługą klawiatury; kliknięcie zmienia tylko inflację i wraca do `current`.
6. Reset całego formularza obligacji/FIRE wraca do `current` i odczytu GUS, zachowując pozostałą semantykę resetu. „Pomiń inflację” nadal wysyła 0, ale zachowuje wybraną wartość i tryb; przy pominięciu przycisk jest wyłączony.
7. Podczas pierwszego ładowania nie wykonywać automatycznych obliczeń z dawną stałą. Formularz pozwala wpisać własne założenie. Po błędzie, gdy brak jakiegokolwiek odczytu, pokazać ponowienie pobrania i umożliwić obliczenia po świadomym wpisaniu własnej wartości.
8. Ostatnie poprawne dane z oznaczeniem nieaktualności mogą nadal zasilać formularz; etykieta i przycisk mówią wtedy „Użyj ostatniego odczytu: X%”, bez obietnicy aktualności. Nie wracać po cichu do 3,5% ani 2,5%.
9. SSR/prerender pokazuje neutralny stan ładowania. Odczyt runtime i localStorage wykonywać w przeglądarce; statyczne przykłady edukacyjne pozostają jawnie przykładami.
10. Opis: „Ostatni odczyt GUS jako założenie scenariusza. To nie prognoza przyszłej inflacji”. Zmiana miesiąca oferty obligacji nie zmienia inflacji ani trybu użytkownika.

W celu i FIRE rozszerzyć walidację inflacji do −99…100% wraz z opisami i atrybutami pól. Dla celu zmienić też DTO backendu do −0,99…1, po przeglądzie wzorów i testach deflacji. Nie zaokrąglać ujemnego odczytu do zera. Pozostałe limity formularzy pozostają bez zmian.

## Kolejność implementacji i odbiór

1. Pobrać rzeczywisty CSV GUS, potwierdzić serię i metadane, zapisać fixture oraz niezależne oczekiwane wartości. Warunek: powtarzalny dry-run na rzeczywistych danych.
2. Kontrakt, parser, repozytorium i emulator: nowy miesiąc, korekta, duplikat, ponowienie starej rewizji, równoległy zapis, rollback, błąd transportu i puste dane. Sprawdzić brak bezpośredniego dostępu klientów do nowych kolekcji.
3. Importer, CLI, harmonogram wyłączony flagą oraz API. Testy 200/503, metadanych i aktualności; smoke z istniejącym mechanizmem App Check.
4. Wspólny serwis UI, metadane i przycisk; integracja trzech formularzy, migracja storage i walidacja deflacji. Testy spóźnionej odpowiedzi, edycji tej samej liczby, resetu, trybu current po odświeżeniu, custom po odświeżeniu, pomijania inflacji oraz awarii źródła/API.
5. Regresja obliczeń dla dotychczasowych jawnych założeń; dodatkowe niezależne przypadki z deflacją, zerem i CPI różnym od starej stałej. Sprawdzić, że UI i API używają odpowiednio procentów i ułamków.
6. Uruchomić testy backendu/Angulara, lint obu pakietów, build Functions i Angulara, `check:content`, testy emulatorowe i smoke. Obejrzeć desktop/mobile, dostępność przycisku, stan ładowania oraz SSR.
7. Wdrożenie: sprawdzenie istniejącej bazy/bucketu/IAM → dry-run → pierwszy kontrolowany zapis → API → frontend → alerty → włączenie harmonogramu. Bez tworzenia drugiej bazy i bez zmiany regionu. Nie uzależniać wdrożenia inflacji od zmian parsera ofert obligacji.

Rollback: wyłączyć harmonogram flagą, ewentualnie aktywować poprzednią poprawną rewizję i wycofać frontend. Zachować historię i snapshoty. Automatyczny import ma działać bez kolejnego deploya przy zwykłej miesięcznej publikacji GUS.

## Osobna strona „Inflacja w Polsce”

Rozszerzenie zakresu: publiczna strona `/inflacja`, z historią miesięcznego CPI r/r z tego samego źródła GUS. Etykieta w nawigacji: „Inflacja”.

### Miejsce w nawigacji

- Górne menu: **Kalkulatory → Poradniki → Inflacja → O nas**. „Inflacja” jest samodzielnym linkiem, także w menu mobilnym. Obecne menu ma trzy pozycje, więc dodanie jednej nie wymaga tworzenia nowej kategorii.
- W stopce dodać „Inflacja w Polsce”.
- Przy informacji GUS w formularzach dodać „Zobacz historię inflacji”, prowadzące do `/inflacja`. Powrót z wykresu nie powinien resetować zapisanych założeń użytkownika.
- Zmiany integracyjne: `layout/navigation/navigation.component.ts`, stopka, `app.routes.ts` (lazy-loaded strona przed wildcardem), rejestr SEO, sitemap i konfiguracja SSR/prerender zgodnie z istniejącym mechanizmem projektu. Zweryfikować szerokość nagłówka i przejście do mobilnego menu.

### Zawartość i interakcje

1. Tytuł „Inflacja w Polsce” i ostatni odczyt: procent r/r, miesiąc pomiaru, zmiana względem poprzedniego miesiąca wyrażona w punktach procentowych. Wyliczać różnicę dwóch odczytów r/r, bez nazywania jej inflacją miesiąc do miesiąca.
2. Wykres liniowy: miesiąc na osi X, CPI r/r w procentach na osi Y, widoczna linia zera i wartości ujemne. Tooltip pokazuje miesiąc i dokładny odczyt. Nie interpolować brakujących miesięcy.
3. Wybór zakresu: 1 rok, 5 lat (domyślnie), 10 lat, cały dostępny okres. Oś Y dopasowuje się do zakresu; starsze wysokie odczyty nie utrudniają czytania domyślnego widoku. Zakres opcjonalnie w parametrze URL `range=1y|5y|10y|all`.
4. Dostępna tabela miesięcznych odczytów pod wykresem lub w rozwijanej sekcji, z paginacją dla długich zakresów. Dane dostępne także bez obsługi tooltipów; wykres z opisem dla czytników ekranu.
5. Źródło GUS, informacja o ostatnim udanym sprawdzeniu i ostrzeżenie przy opóźnionych danych. Krótkie wyjaśnienie CPI r/r oraz link do kalkulatora obligacji i celu oszczędnościowego.
6. Wykorzystać już zainstalowane Chart.js, z ładowaniem wykresu po stronie przeglądarki. SSR zawiera tytuł i opis, a aktualne liczby są pobierane runtime. Stany loading/error/empty oraz ponowienie pobrania zgodne z resztą aplikacji.

### Konieczne rozszerzenie importu i API historii

Wykres musi zawierać historię od pierwszego uruchomienia, a nie dopiero od dnia wdrożenia. Pierwszy kontrolowany import przetwarza wszystkie poprawne miesięczne odczyty r/r w CSV. Deklarowany przez GUS początek tabeli to 1982 r.; faktyczny początek wykresu wynika z dostępnych, poprawnych danych wybranej serii, bez sztucznego uzupełniania braków.

- Importer przetwarza serię historyczną i wykrywa również korekty starszych miesięcy. Bieżącego wskaźnika nadal nie cofa import archiwum.
- Dodać `inflationMonths/{YYYY-MM}` jako wskazania dopuszczonych rewizji dla miesięcy. Historia rewizji pozostaje w `inflationReadings`. Zapis miesiąca i rewizji atomowy; duży import podzielony na ograniczone partie, bez jednej transakcji obejmującej całą historię.
- API historii `inflationWarsaw?action=history&from=YYYY-MM&to=YYYY-MM` zwraca uporządkowany szereg z metadanymi serii i wersją zestawu. Walidować zakres, maksymalną liczbę punktów oraz paginować długie odpowiedzi. Klient składa strony i odrzuca mieszanie wersji; przy zmianie zestawu ponawia pobranie. Odczyt bieżący i ostatni punkt wykresu muszą wskazywać tę samą dopuszczoną rewizję po zakończeniu importu.
- Udostępniać w historii wyłącznie ukończoną generację importu: najpierw zapisać rewizje i wersjonowany manifest miesięcy w partiach, a potem atomowo przełączyć wskaźnik aktywnego zestawu oraz `inflationCatalog/current`. API historii jest przypięte do generacji; niedokończony import nie ujawnia połowy nowego zestawu. `inflationMonths` może pełnić rolę pomocniczą, ale nie jest odczytywany bez przypięcia do generacji.
- Zakres pełnej historii ograniczyć do zweryfikowanej pojemności, np. 2000 punktów na zestaw i 250 na stronę. Manifest dzielić, jeśli zbliża się do limitu dokumentu Firestore. Bez potrzeby publicznego dostępu do kolekcji.
- Dodać testy historycznej korekty, niepełnego importu, wersjonowanej paginacji, brakującego miesiąca, przełomu roku i zgodności ostatniego punktu z danymi formularzy. Sprawdzić routing, aktywny link, mobilne menu, zakresy wykresu i dostępność tabeli.

Stronę wdrożyć po zasileniu bazy historią i udostępnieniu API; uwzględnić ją w kroku integracji UI oraz smoke. Planowanie tej strony nie oznacza uruchomienia nowego harmonogramu: korzysta z tego samego `syncInflation`.
