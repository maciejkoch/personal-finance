# Automatyczne oferty obligacji — uruchomienie i utrzymanie

## Zakres

Backend obsługuje wersjonowane oferty siedmiu typów (bez OTS), katalog miesięcy, API v4, import listów emisyjnych, korekty i wycofanie błędnej wersji. Frontend wybiera domyślnie najnowszą ofertę, której sprzedaż już się zaczęła, oraz pozwala wskazać konkretną wersję przez `?offerId=...`. Nadchodząca oferta jest oznaczona osobno. Brak bieżącej oferty powoduje komunikat o nieaktualności, a awaria odczytu wyłącza obliczenia zamiast podmieniać wersję.

Konfiguracja docelowa: **Firestore Standard Native, `(default)`, `europe-central2` (Warszawa)**. Baza nie istniała podczas weryfikacji projektu; API i billing były włączone. PR nie tworzy zasobów produkcyjnych ani nie wykonuje deploya. Region został wybrany przez użytkownika. Standard wystarcza, ponieważ funkcje odczytują konkretne dokumenty i wykonują transakcje bez zapytań kolekcji. Katalog jest jednym dokumentem ograniczonym do 600 miesięcy, API stronicuje go po 25 pozycji. Baza nie jest dostępna bezpośrednio z przeglądarki.

## Dane i poprawność

- `bondOffers/{offerId}`: niezmienna oferta, dowody źródłowe, czas zapisu, osobny znacznik wycofania. ID jest skrótem SHA-256 kanonicznych danych (bez czasu weryfikacji i deklarowanej wersji).
- `bondOfferCatalog/months`: mapa miesiąca na dopuszczoną wersję. Zapis wersji i katalogu w jednej transakcji. Ponowienie starego importu nie cofa nowszej korekty.
- `bondImportStatus/{YYYY-MM}`: ostatni rezultat i czas sprawdzenia. Historia wersji jest trwała, statusy są nadpisywane; szczegóły kolejnych uruchomień zapewniają Cloud Logging i metadane wersji. `bondImportRuns` zachowuje różne zestawy hashy źródeł, także gdy treść oferty nie zmieniła się. Identyczny zestaw nie tworzy duplikatu.
- Cloud Storage: prywatne PDF pod `bond-sources/{sha256}.pdf`. Zapis z warunkiem `ifGenerationMatch: 0` nie nadpisuje istniejących źródeł.
- API v4 wymaga `offerId` i `familyEligible`; wynik identyfikuje tę samą wersję. Nieznane ID: 404, wycofane: 410, brak bazy: 503. Wersje v3 i wcześniejsze pozostają przypięte do dotychczasowego JSON.
- Celowo brak cache API w pierwszym wydaniu (`no-store`): korekty, wycofanie i granica miesiąca są widoczne przy kolejnym odczycie. UI pozostaje przypięte do załadowanej wersji przez sesję obliczeń; odświeżenie bez `offerId` wybiera aktualną.
- Historyczna oferta nie oznacza odtworzenia rzeczywistych historycznych stóp. Symulacja zachowuje założenia użytkownika i dotychczasowe uproszczenia reinwestowania.

Importer porównuje pełną treść prawną i wzory ze sprawdzonymi wzorcami z września i października 2026. Normalizuje identyfikatory emisji, daty, tabele dat kalendarzowych i odczytane oprocentowanie, marże, ceny zamiany oraz opłaty. Weryfikuje też zgodność kwoty wykupu TOS z oprocentowaniem. Pozostałe zmiany treści powodują odrzucenie. Dzięki temu nie przenosi niepotwierdzonych reguł z poprzedniej emisji. Przykładowo nowa formuła, zmiana ochrony nominału, długości okresów lub terminów wykupu wymaga przeglądu. Zmiana redakcyjna również może wymagać aktualizacji wzorca. Nie jest to parser dowolnego dokumentu prawnego.

Normalizacja kalendarzy dotyczy tabel bankowych; kalkulator nadal stosuje opisane miesięczne rocznice i nie symuluje terminów dyspozycji bankowych. Daty sprzedaży są odczytywane i walidowane osobno dla wszystkich siedmiu listów. Niepełny zestaw nie jest publikowany. Źródło jest publiczną stroną, nie gwarantowanym API, więc zmiana jej formatu wywoła alert.

## Lokalne sprawdzenie

Wymagane Node 22 oraz Java 21 dla emulatora.

```sh
npm ci
npm --prefix functions ci
npm run test:regression
npm run test:offers:emulator
npm run lint
npm run lint:functions
npm run build
npm run check:content
npm run emulators
```

W drugim terminalu, przy działającym emulatorze:

```sh
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GCLOUD_PROJECT=personal-finance-2ee61 npm run bonds:admin -- seed --write
node scripts/smoke-bond-offers.mjs
npm start
```

`seed` importuje zweryfikowaną ofertę startową z repozytorium; nie pobiera PDF. Test integracyjny sprawdza anonimowy odczyt/zapis/usuwanie (odmowa), transakcje, równoległe ponowienia, korekty, rollback, wycofanie i API. Nie używa konta produkcyjnego. Stare testy obliczeń i kontraktów nadal obowiązują.

Dry-run z oficjalnego źródła, bez zapisu do chmury:

```sh
npm run bonds:admin -- import 2026-10
```

## Przygotowanie infrastruktury po review

1. Ponownie sprawdzić listę baz. Nie nadpisywać istniejącej instancji, jeśli powstała od czasu przygotowania PR. Utworzyć `(default)` w Warszawie, jeśli nadal nie istnieje:

```sh
npx -y firebase-tools@15.34.1 firestore:databases:list --project personal-finance-2ee61
npx -y firebase-tools@15.34.1 firestore:databases:create '(default)' --edition standard --location europe-central2 --project personal-finance-2ee61
npx -y firebase-tools@15.34.1 deploy --only firestore --project personal-finance-2ee61
```

Lokalizacja bazy `(default)` może być już ograniczona przez ustawienie domyślnych zasobów projektu, nawet jeśli sama baza jeszcze nie istnieje. Jeśli utworzenie jej w Warszawie zostanie odrzucone, nie wybierać innego regionu: utworzyć nazwaną bazę Standard Native w `europe-central2`, ustawić `BOND_DATABASE_ID` dla Functions i CLI oraz dostosować `firestore.database` przed wdrożeniem reguł. Nie tworzyć obu baz na próbę.

2. Utworzyć prywatny bucket w tej samej lokalizacji. Nazwa przykładowa jest globalnie unikalna; jeśli zajęta, dostosować też konfigurację:

```sh
gcloud storage buckets create gs://personal-finance-2ee61-bond-sources --project=personal-finance-2ee61 --location=europe-central2 --uniform-bucket-level-access --public-access-prevention
```

3. Ustalić konto wykonawcze Functions w projekcie. Odczyt API wymaga odczytu Firestore, importer wymaga zapisu Firestore i tworzenia obiektów w dedykowanym bucketcie. Przydzielić role na właściwych zasobach, preferując oddzielne konta dla importera i publicznego odczytu. Admin SDK korzysta z IAM i omija Security Rules; reguły blokujące klientów nie zastępują IAM. Konto administracyjne uruchamiające CLI musi mieć uprawnienia do zapisu oraz ADC (`gcloud auth application-default login`), nie tylko sesję Firebase CLI. Nie zapisywać kluczy w repozytorium.

4. Skopiować `functions/.env.example` do `functions/.env.personal-finance-2ee61`, ustawić bucket i pozostawić `BOND_IMPORT_ENABLED=false`. Plik jest ignorowany przez Git. Domyślne konto wykonawcze jest obecnie kontem projektu; ewentualne dedykowane konta ustawić w opcjach `serviceAccount` przed deployem.

5. Z konta administracyjnego zaimportować ofertę startową. Produkcyjny zapis wymaga jawnego projektu i `--write`:

```sh
GCLOUD_PROJECT=personal-finance-2ee61 npm run bonds:admin -- seed --write
```

6. Włączyć wymagane API Cloud Scheduler/Cloud Run/Monitoring i skonfigurować alert z `infra/bond-import-alert.json`, dodając kanał powiadomień operatora. Przykład dla istniejącego kanału:

```sh
gcloud monitoring policies create --project=personal-finance-2ee61 --policy-from-file=infra/bond-import-alert.json --notification-channels=projects/personal-finance-2ee61/notificationChannels/CHANNEL_ID
```

Dodatkowo utworzyć licznik sukcesów i alert braku wykonania przez 23,5 godziny:

```sh
gcloud logging metrics create bond_import_success --project=personal-finance-2ee61 --description="Successful bond imports" --log-filter='resource.type="cloud_run_revision" resource.labels.service_name="syncbondoffers" jsonPayload.message="BOND_IMPORT_SUCCEEDED"'
gcloud monitoring policies create --project=personal-finance-2ee61 --policy-from-file=infra/bond-import-stale-alert.json --notification-channels=projects/personal-finance-2ee61/notificationChannels/CHANNEL_ID
```

Alert nieobecności wymaga co najmniej jednego udanego wykonania, więc sprawdzić pierwszy sukces po uruchomieniu. Dodać również alert Cloud Scheduler na nieudane wywołanie funkcji. Kanał i jego odbiorca są ustawieniem operatora; PR nie wysyła wiadomości ani nie tworzy kanału. Alert błędu obejmuje również brak kompletu bieżącej oferty; nie alarmuje o jeszcze nieopublikowanym kolejnym miesiącu.

## Migracja Functions do Warszawy bez przerwy

Istniejące cztery eksporty `*HttpFunction` pozostają w `us-central1`, aby uniknąć destrukcyjnej zmiany regionu i obsłużyć otwarte stare klienty. Nowe eksporty w `europe-central2`:

- `calculateSavingsWarsaw`
- `calculateRegularContributionWarsaw`
- `calculateTreasuryBondsWarsaw`
- `articleWarsaw`
- `syncBondOffers`

Najpierw wdrożyć tylko te funkcje, bez kasowania starych:

```sh
npx -y firebase-tools@15.34.1 deploy --only functions:calculateSavingsWarsaw,functions:calculateRegularContributionWarsaw,functions:calculateTreasuryBondsWarsaw,functions:articleWarsaw,functions:syncBondOffers --project personal-finance-2ee61
npm run smoke:api -- --production --contracts
npm run smoke:bonds -- --production
node scripts/smoke-savings.mjs --production
node scripts/smoke-bond-offers.mjs --production
```

Następnie `npm run deploy` przełącza frontend na stabilne adresy `europe-central2-...cloudfunctions.net`. Firebase Hosting pozostaje globalnym CDN. Sprawdzić ofertę, historię, źródła, formularz, błędy i wyniki na desktop/mobile. Nowy frontend wymaga bazy i zasianego katalogu — nie publikować go przed backendem.

Wykonać rzeczywisty import w trybie dry-run, a potem `--write`. Po sprawdzeniu danych ustawić `BOND_IMPORT_ENABLED=true` i ponownie wdrożyć `syncBondOffers`. Harmonogram działa codziennie o 08:00 i 20:00 czasu Warszawy; publikacja nie jest natychmiastowa, tylko przy następnym udanym sprawdzeniu. Dwa uruchomienia dziennie zapewniają odstęp krótszy od maksymalnego okna 23,5 godziny obsługiwanego przez alert braku danych. Funkcja sprawdza bieżący i kolejny miesiąc. Maksymalnie dwa ponowienia zaplanowanego wywołania; sam transport ma timeouty i ograniczone próby. Nie ma potrzeby deploya przy zwykłej nowej ofercie.

Stare funkcje w USA usunąć dopiero po okresie obserwacji ruchu i migracji klientów, w osobnym wdrożeniu usuwając także stare eksporty z kodu. Do tego czasu są celowo obecne w dwóch regionach. Wycofanie nowego hostingu przed ich usunięciem przywraca poprzedniego klienta. Sama baza i historia nie wymagają kasowania podczas rollbacku.

## Korekty, historia i sytuacje awaryjne

```sh
# Import starego miesiąca: wykaz bieżący, następnie archiwum, te same walidatory.
GCLOUD_PROJECT=personal-finance-2ee61 npm run bonds:admin -- import 2026-09 --write

# Dla nieobsługiwanej treści: ręcznie zweryfikowany kompletny JSON zgodny ze schematem.
# Najpierw dry-run, następnie jawne opublikowanie. Nowe reguły algorytmu wymagają zmiany kodu.
npm run bonds:admin -- publish /absolute/path/reviewed-offer.json
GCLOUD_PROJECT=personal-finance-2ee61 npm run bonds:admin -- publish /absolute/path/reviewed-offer.json --write

# Przywrócenie poprawnej rewizji katalogu; historia pozostaje bez zmian.
GCLOUD_PROJECT=personal-finance-2ee61 npm run bonds:admin -- activate OFFER_ID --write

# Wycofanie niepoprawnej wersji i usunięcie jej z katalogu, jeżeli była aktywna.
GCLOUD_PROJECT=personal-finance-2ee61 npm run bonds:admin -- withdraw BAD_OFFER_ID "Błędna interpretacja dokumentu" --write
```

Zatrzymanie harmonogramu: ustawić `BOND_IMPORT_ENABLED=false` i wdrożyć funkcję albo wstrzymać zadanie Scheduler w konsoli. W razie błędu parsera źródłowe PDF pozostają w prywatnym bucketcie. Nowy wzorzec prawny dopuszczać po przeglądzie i testach niezależnych oczekiwanych wartości. Nie regenerować referencji obliczeń na podstawie badanego algorytmu.

Historia starsza od dołączonych wzorców może wymagać nowych parserów lub ręcznej weryfikacji danych. Zakres i daty archiwum nie są zakładane z góry. Migracja nie importuje automatycznie całego archiwum przy deployu.

## Przegląd reguł

I've set up prototype Security Rules to keep the data in Firestore safe. They are designed to be secure for backend-only access by denying all direct client reads and writes. However, you should review and verify them before broadly sharing your app. If you'd like, I can help you harden these rules.

Reguły przetestowano w emulatorze; uprawnienia produkcyjnego konta wykonawczego wymagają osobnej kontroli podczas uruchomienia.
