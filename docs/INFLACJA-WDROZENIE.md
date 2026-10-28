# Inflacja GUS — wdrożenie i utrzymanie

Implementacja na branchu `codex/inflation-sync-plan`. Bez deploya ani zapisów produkcyjnych podczas prac.

## Źródło i dane

[GUS: miesięczne wskaźniki cen od 1982 r.](https://publikacje.new.stat.gov.pl/portal-publikacje/miesieczne-wskazniki-cen-towarow-i-uslug-konsumpcyjnych-od-1982-r). Importer odkrywa bieżący załącznik CSV na stronie, dekoduje UTF-8/Windows-1250 i wybiera Polska, CPI ogółem, analogiczny miesiąc poprzedniego roku = 100. Szybkie szacunki nie są pobierane. Próbka pobrana 28.10.2026 zawiera 537 odczytów od 1982-01 do 2026-09. Zachowuje flagę historyczną `a`; nieznane flagi są odrzucane i wymagają przeglądu. Nie zakładamy, że nieznana flaga oznacza ostateczne dane.

Sprawdzono istniejącą bazę `(default)` w `personal-finance-2ee61`: Standard Native, Warszawa (`europe-central2`). Używany jest wspólny inicjalizator bazy z ofertami obligacji i dotychczasowe `BOND_DATABASE_ID`. Nie tworzyć nowej bazy.

Model uproszczony względem planu: kompletna, ograniczona historia (do 2000 punktów i 600 kB) w niezmiennym `inflationDatasets/{SHA256}`. `inflationCatalog/current` wskazuje gotowy zestaw i ostatni punkt. Cała publikacja z aktualizacją statusu odbywa się w jednej transakcji; nie potrzeba manifestów częściowych ani osobnej kolekcji miesięcy. ID hashuje wyłącznie dane ekonomiczne wraz z flagami, bez czasu pobrania. Starsze rewizje pozostają dostępne do przypiętej paginacji i rollbacku. Limit dotyczy rozmiaru danych, nie wysokości historycznej inflacji (w 1990 r. przekraczała 1000%).

`inflationImportStatus/lease` serializuje importy przed pobraniem źródła. Lease wygasa po 10 minutach, funkcja ma timeout 9 minut. Transakcja odrzuca wygasły token, cofnięcie okresu, utratę miesięcy i niejawne przywrócenie starej rewizji. `inflationImportStatus/current` zachowuje ostatni sukces także po błędzie. `inflationImportRuns/{sourceSha256}` rejestruje zestaw dowodów; CSV jest prywatnie archiwizowany pod `inflation-sources/{sha256}.csv` przed parsowaniem.

## Sprawdzenie lokalne

```sh
npm run test:regression
npm run test:inflation:emulator
npm run lint
npm run lint:functions
npm run build -- --stats-json
npm run check:content
npm run inflation:admin -- import
```

Ostatnie polecenie jest dry-run: nie inicjalizuje bazy, nie używa Storage i nie zapisuje do chmury. CLI korzysta z Node 22. Emulator wymaga Java 21. Do powtórnego uruchomienia testu użyć świeżego emulatora, bez importu danych z poprzedniego testu.

## Uruchomienie

1. Zweryfikować aktualną bazę, istniejący prywatny bucket i IAM konta wykonawczego: odczyt/zapis Firestore oraz tworzenie obiektów w bucketcie. Reguły blokujące klienta nie ograniczają Admin SDK. Wdrażanie reguł nie wymaga zmian — dotychczasowa odmowa obejmuje nowe kolekcje.
2. W konfiguracji Functions pozostawić `BOND_DATABASE_ID` i `BOND_SOURCE_BUCKET`. Opcjonalne `INFLATION_SOURCE_BUCKET` nadpisuje bucket wyłącznie dla inflacji. Początkowo `INFLATION_IMPORT_ENABLED=false`.
3. Wykonać dry-run z rzeczywistego GUS, obejrzeć okres, wartości i liczbę odczytów. Następnie kontrolowany zapis (wymaga ADC i jawnego projektu):

```sh
GCLOUD_PROJECT=personal-finance-2ee61 npm run inflation:admin -- import --write
```

CLI nie wczytuje automatycznie plików `.env`; przed zapisem ustawić również `BOND_SOURCE_BUCKET` lub `INFLATION_SOURCE_BUCKET` w środowisku. Nie kopiować kluczy do repozytorium.

4. Wdrożyć indeksy (wyłączenia indeksowania pól `inflationDatasets.points/evidence`) i nowe funkcje `inflationWarsaw`, `syncInflation`, z harmonogramem jeszcze wyłączonym:

```sh
npx -y firebase-tools@15.34.1 deploy --only firestore:indexes,functions:inflationWarsaw,functions:syncInflation --project personal-finance-2ee61
```

5. Sprawdzić GET `inflationWarsaw`, historię `?action=history`, kolejne strony z tym samym `datasetId`, App Check i obsługę błędów. Ten sam endpoint dla klienta i historii korzysta z istniejącego CORS/App Check; brak tokenu w trybie enforce oznacza odmowę. Następnie wdrożyć frontend przez istniejące `npm run deploy` i sprawdzić `/inflacja` oraz trzy formularze na telefonie i desktopie.
6. Utworzyć alert z `infra/inflation-import-alert.json`. Obejmuje nieudany import oraz `INFLATION_DATA_STALE` (brak odczytu z ostatnich 2 miesięcy). Utworzyć licznik logów `inflation_import_success` dla `jsonPayload.message="INFLATION_IMPORT_SUCCEEDED"` w usłudze `syncinflation`, a potem politykę z `infra/inflation-import-stale-alert.json`. Okno braku sukcesu wynosi 23,5 godziny, jak w istniejącym monitoringu obligacji; UI oznacza brak sprawdzenia po 26 godzinach. Podłączyć istniejący kanał operatora. Polityka nieobecności wymaga pierwszego sukcesu.
7. Włączyć `INFLATION_IMPORT_ENABLED=true` i wdrożyć `syncInflation`. Harmonogram: codziennie 08:00 i 20:00 Europe/Warsaw. Przy nowej publikacji GUS frontend nie wymaga deploya.

## API i formularze

GET bez parametrów zwraca ostatni odczyt wraz z `dataStale`, `syncStale`, `checkedAt`, źródłem i `datasetId`. GET `action=history` obsługuje `from`, `to`, `cursor` (okres) oraz `datasetId`. Strony mają do 250 punktów; `nextCursor=null` kończy serię. Zawsze przekazywać ten sam `datasetId` przy kolejnych stronach. Błędne parametry: 400; brak zestawu: 404; wycofany: 410; brak danych/bazy: 503; metoda inna niż GET: 405.

Formularze mają niezależne tryby current/custom. Stare zapisane wartości są traktowane jako własne. Spóźniony odczyt nie nadpisuje ręcznej edycji, także wpisania tej samej liczby lub wyczyszczenia pola. Własna inflacja jest pamiętana pod kluczem formularza z sufiksem `:inflation-mode`; pozostałe dotychczasowe wartości i klucze pozostają zgodne. Tryb current po odświeżeniu ponownie pobiera GUS. Bez odczytu nie wykonujemy obliczeń ze starą stałą; można wpisać własne założenie. Cel i FIRE obsługują też deflację. Pole celu z zaznaczonym „Pomiń inflację” wysyła 0.

`/inflacja` ma samodzielny link w menu między Poradnikami i O nas, link w stopce oraz przy polach inflacji. Wykres i tabela korzystają z jednej generacji danych. Brakujące miesiące są przerwami, zakresy liczą miesiące kalendarzowe, a różnica dwóch odczytów r/r jest wyrażona w punktach procentowych.

## Awaria i rollback

Błąd źródła pozostawia ostatni poprawny zestaw i rejestruje przyczynę. Źródłowy CSV i niezmienne wersje pozostają dostępne do przeglądu. Nieznany format/flaga wymaga poprawienia parsera i testów na rzeczywistej próbce. Nie uzupełniać brakujących liczb domysłami.

```sh
GCLOUD_PROJECT=personal-finance-2ee61 npm run inflation:admin -- activate DATASET_ID --write
GCLOUD_PROJECT=personal-finance-2ee61 npm run inflation:admin -- withdraw BAD_DATASET_ID "Powód wycofania" --write
```

Najpierw aktywować zweryfikowany poprawny zestaw, potem wycofać błędny. Wycofanie aktywnego zestawu usuwa wskaźnik bieżący i API zwraca 503 do czasu aktywacji poprawnych danych. Wstrzymać Scheduler lub ustawić flagę false, aby importer nie przywracał problematycznych danych. Rollback danych nie udaje nowego sprawdzenia GUS. Historia nie jest usuwana.

## Weryfikacja implementacji (28.10.2026)

- 168 testów backendu i 141 testów Angulara: PASS.
- Emulator Firestore: lease, retry, korekty, brakujące miesiące, historyczna paginacja, rollback, wycofanie i anonimowa odmowa odczytu/zapisu/usuwania: PASS.
- Dry-run na aktualnym pliku GUS: 537 odczytów; ostatni 2026-09, 4,1% r/r. Żadnych zapisów produkcyjnych.
- Build Functions, lint obu pakietów, build produkcyjny z prerenderem 10 tras oraz kontrola treści/SEO.
- Ręczna weryfikacja w przeglądarce: desktop, viewport 390×844, menu mobilne i powrót z własnej inflacji do GUS w FIRE. Podglądy `inflation/desktop.png` i `inflation/mobile.png` korzystają z oficjalnej próbki CSV obsługiwanej przez tymczasowy lokalny serwer testowy, bez wdrożenia API.
