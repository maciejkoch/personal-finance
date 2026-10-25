# Plan automatycznej aktualizacji i historii ofert obligacji

Data: 2026-10-24. Status: plan bazowy; implementacja przygotowana na branchu `codex/bond-offer-history`. Konfiguracja docelowa: Firestore Standard Native i Functions w Warszawie (`europe-central2`). Procedura wdrożenia i jawne ograniczenia: [wdrożenie](OBLIGACJE-AUTOMATYCZNE-WDROZENIE.md). Produkcja nie została zmieniona.

## Cel i założenia

Automatycznie wykrywać kolejne miesięczne oferty, zapisywać zweryfikowane wersje w Firestore i udostępniać je przez istniejący backend Firebase Functions. UI domyślnie pokazuje najnowszą obowiązującą ofertę, pozwalając wybrać miesiąc historyczny i opublikowaną ofertę nadchodzącą.

- Sprawdzanie źródła codziennie o 08:00 i 20:00 w `Europe/Warsaw`; zapis tylko po wykryciu zmian. Przy sprawnym źródle nowa oferta pojawia się najpóźniej podczas następnego sprawdzenia, a nie natychmiast po publikacji.
- Zakres początkowy: siedem obecnie obsługiwanych typów ROR, DOR, TOS, COI, EDO, ROS, ROD. Dodanie OTS jest osobnym zadaniem.
- Historyczna oferta oznacza symulację na parametrach danej emisji i założeniach użytkownika. Nie oznacza odtworzenia rzeczywistych historycznych stóp NBP ani inflacji.
- Nowe stawki w obsługiwanym modelu mogą być publikowane automatycznie po walidacji. Nieznane zasady lub niepełne źródła wymagają wyjaśnienia i nie trafiają automatycznie do kalkulatora.
- Starsze miesiące będą dostępne dopiero po osobnym imporcie archiwum.

## Stan obecny i miejsca zmian

- Angular 22.2 i NgRx Signals; backend Cloud Functions v2, Node 22, Zod, dostępny `firebase-admin`.
- `functions/src/treasury-bonds/treasury-bonds.offer.json` jest wspólnym statycznym źródłem dla backendu i UI przez alias `@data/bond-offer`.
- `treasury-bonds.ts` zwraca wersję statycznej oferty, a siedem plików `services/*.service.ts` przekazuje stałe parametry do `simulateBond`.
- `bond-simulation.ts` dodatkowo wyprowadza daty ze statycznego `saleFrom`. Sama podmiana stóp nie wystarczy do prawidłowej obsługi historii.
- `treasury-bonds.component.ts`, `treasury-bonds-form-state.ts`, data service oraz adapter odpowiedzi zależą od statycznej oferty. Adapter wymaga literalnie wersji z lokalnego JSON.
- `firebase.json` zawiera Hosting i Functions, ale nie konfigurację Firestore ani jego emulatora. Istnienie i edycja bazy w chmurze nie zostały zweryfikowane.
- Obecny proces ręczny opisuje `docs/OBLIGACJE-AKTUALIZACJA-MIESIECZNA.md`; należy go zastąpić procedurą importu, kontroli i korekt.

## Etap 1 — weryfikacja infrastruktury i źródeł

1. Sprawdzić bazy Firestore w projekcie `personal-finance-2ee61`, ich edycję, region oraz użycie przez inne funkcje. Ustalić docelową instancję; dopiero wtedy dobrać fizyczny schemat, zapytania i indeksy. Dla nowej instancji ustalić region blisko backendu.
2. Zweryfikować billing Blaze, Cloud Scheduler API i uprawnienia konta funkcji. Oszacować koszt harmonogramu, wywołań, odczytów i przechowywania źródeł.
3. Zbadać oficjalne strony oferty, archiwum i listy emisyjne. Potwierdzić, czy istnieje udokumentowany interfejs danych; nie zakładać jego dostępności.
4. Zbudować próbkę importu na co najmniej dwóch miesiącach. Sprawdzić możliwość wiarygodnego odczytania wszystkich obecnych parametrów, w tym zasad wykupu, a nie tylko oprocentowania.
5. Zapisać źródłowe próbki do testów parsera; rozróżnić datę publikacji, wykrycia i początek sprzedaży. Nie wyprowadzać miesiąca wyłącznie z numeru serii.

Warunek zakończenia: potwierdzona instancja bazy i sposób pobierania kompletnych danych. Jeśli źródło nie pozwala na pewną automatyczną interpretację, importer zachowuje kandydata do weryfikacji zamiast publikować domysły.

## Etap 2 — kontrakt oferty i repozytorium

1. Wprowadzić niezależny od Firebase kontrakt i walidację Zod pełnej oferty. Zachować obecne parametry instrumentów oraz rozdzielić wersję danych, schematu i algorytmu obliczeń.
2. Zdefiniować logicznie: niezmienne wersje ofert, katalog miesięcy wskazujący dopuszczoną wersję oraz dziennik importów. Fizyczny model ustalić po etapie 1.
3. Każda wersja ma jednoznaczne `offerId`, miesiąc, okres sprzedaży, parametry siedmiu serii, źródła i numery listów, hashe źródeł, czas pobrania, wynik walidacji i wersję parsera. `publishedAt` zapisywać tylko gdy źródło go podaje.
4. Oddzielić wynik walidacji od statusu czasowego: oferta może być poprawna, ale nadchodząca lub archiwalna. Aktualność wyliczać z dat w Warszawie, a nie z daty zapisu.
5. Repozytorium udostępnia odczyt konkretnej wersji, listę miesięcy oraz wybór bieżącej oferty. Zapis kompletnej wersji i aktualizacja katalogu muszą być atomowe. Korekta tworzy nową wersję, bez nadpisania wcześniejszej.
6. Dostęp do bazy tylko z backendu. Klient korzysta z HTTP; reguły blokują bezpośredni dostęp klientów, a uprawnienia kont usług ograniczają zapisy. Admin SDK wymaga kontroli IAM niezależnie od reguł.
7. Dodać konfigurację bazy, wymaganych indeksów i emulatora. Skrypt startowy importuje obecny JSON jako pierwszą wersję po jego weryfikacji.

Warunek zakończenia: odczyt historii i atomowy, odporny na duplikaty zapis działają w emulatorze.

## Etap 3 — importer i harmonogram

1. Rozdzielić pobieranie źródeł, parsowanie, normalizację, walidację i publikację w nowym module `functions/src/bond-offers/`.
2. Weryfikować kompletność siedmiu serii, zgodność miesiąca i okresów sprzedaży, jednostki procentów, terminy, marże, opłaty, kapitalizację oraz obsługiwane reguły. Nie kopiować brakujących pól z poprzedniego miesiąca bez potwierdzenia źródłowego.
3. Przechowywać kopie źródeł w Cloud Storage, a ich odnośniki i SHA-256 przy wersji. Przy konfiguracji uwzględnić uprawnienia oraz retencję dziennika importów; historia opublikowanych ofert pozostaje trwała.
4. Liczyć hash znormalizowanych danych niezależnie od czasu pobrania. Powtórne uruchomienie dla tej samej oferty nie tworzy kolejnej wersji. Zmiana pliku źródłowego przy identycznych parametrach jest zapisywana w audycie.
5. Dodać funkcję `onSchedule` uruchamianą codziennie o 08:00 i 20:00 w `Europe/Warsaw`. Obsłużyć timeouty, ograniczone ponowienia i równoległe wywołania za pomocą idempotencji i transakcji.
6. Nie publikować niekompletnej oferty. Przy błędzie zachować ostatnią poprawną wersję i zapisać przyczynę; alertować o awarii importu i braku aktualnej oferty po rozpoczęciu miesiąca.
7. Udostępnić narzędzie administracyjne z trybem dry-run do ponownego importu, korekt i importu wskazanego miesiąca, bez publicznego endpointu zapisu.
8. Nowa poprawna oferta pojawia się jako nadchodząca. W dniu `saleFrom` staje się bieżąca przez wybór według dat, bez zależności od sukcesu kolejnego importu.

Warunek zakończenia: nowy miesiąc i korekta są wykrywane, a błędy i powtórzenia nie zmieniają poprawnej oferty.

## Etap 4 — API i kalkulator korzystający z wybranej wersji

1. Dodać publiczne API odczytu: bieżąca oferta, lista miesięcy z paginacją oraz szczegóły po `offerId`. API zwraca wyłącznie dopuszczone wersje i metadane aktualności.
2. Nowy klient zawsze wysyła konkretne `offerId` uzyskane z API. Backend pobiera je raz na żądanie, sprawdza zgodność z algorytmem i przekazuje cały kontekst do obliczeń.
3. Zmienić `calculateComparison`, kalkulatory poszczególnych typów i `simulateBond`, aby używały wybranych parametrów i `saleFrom`. Usunąć zależności od globalnej oferty z nowej ścieżki obliczeń.
4. Rozszerzyć kontrakt odpowiedzi o `offerId` i metadane wybranej wersji. Adapter porównuje wynik z ofertą wysłaną w żądaniu, zachowując kontrolę wersji algorytmu, scenariuszy i kompletności osi czasu.
5. Wprowadzić kontrakt v4 dla dynamicznych ofert. Dotychczasowe kontrakty, w tym v3, pozostawić przejściowo przypięte do obecnego JSON, ponieważ stare klienty walidują jego literalną wersję. Wycofanie starej ścieżki będzie osobnym krokiem po migracji.
6. Nie zastępować nieznanego `offerId` bieżącą ofertą: zwracać 404; błędne parametry 400; chwilową niedostępność danych 503. Wycofane błędne wersje oznaczać jednoznacznie i nie używać ich po cichu.
7. Buforować niezmienne wersje po ID, a katalog i bieżącą ofertę krótkotrwale. Cache bieżącej oferty musi wygasać również na granicy okresu sprzedaży. Unieważniać cache przy korekcie lub wycofaniu.

Warunek zakończenia: dwie oferty o różnych parametrach i datach dają prawidłowe, odtwarzalne wyniki; stary klient nadal działa.

## Etap 5 — UI i wybór historii

1. Rozszerzyć endpointy HTTP i `TreasuryBondsDataService` o pobieranie katalogu i szczegółów oferty.
2. W istniejącym store opartym na Signals dodać katalog, wybraną ofertę, ładowanie oraz błędy. Zachować obecny sposób obsługi formularzy.
3. Dodać wybór „Aktualna oferta” i konkretnych miesięcy, z oznaczeniem oferty nadchodzącej. Domyślnie wybierać najnowszą obowiązującą, nie rekord ostatnio zapisany.
4. Przy braku oferty na bieżący miesiąc pokazać ostatnią poprawną z komunikatem o jej okresie i braku aktualizacji; nie przedstawiać jej jako bieżącej.
5. Zasilić tabelę, opisy, źródła, domyślne wartości zależne od emisji i obliczenia tą samą wersją. Zmiana miesiąca unieważnia poprzedni wynik, ale zachowuje założenia użytkownika.
6. Zablokować obliczenia do załadowania pełnej oferty. Anulować lub ignorować spóźnione odpowiedzi dla wcześniej wybranego miesiąca.
7. Zapisywać konkretną wersję w parametrze URL `offerId`, aby odświeżenie i udostępnienie linku zachowywało wybór. Brak parametru oznacza aktualną ofertę.
8. Usunąć statyczne importy oferty z nowej ścieżki UI i walidatora. Sprawdzić prerender oraz treści/metadane: stawki w wygenerowanym HTML nie mogą udawać aktualnych po zmianie miesiąca. Statyczny render może zawierać neutralną treść, a aktualną ofertę pobierać w runtime.
9. Wyraźnie opisać, że wybór archiwalnej emisji zmienia warunki obligacji, ale pozostawia scenariusz inflacji i stóp użytkownika.

Warunek zakończenia: wybór miesiąca zmienia całą prezentację i faktyczne dane kalkulatora, a UI nigdy nie miesza wersji.

## Etap 6 — testy i uruchomienie

- Parser: rzeczywiste próbki źródeł, brak serii, zmieniony format, błędne jednostki, korekta, nieznane warunki i niedostępny dokument.
- Baza/import: dwa równoległe uruchomienia, retry, częściowy błąd, identyczne dane, nowa rewizja, wycofanie oraz brak dostępu klienta do zapisu.
- Wybór oferty: granica miesiąca w Warszawie, wcześniejsza publikacja, opóźniona publikacja i import starego miesiąca, który nie zmienia bieżącej oferty.
- Kalkulator: zachowanie istniejących wyników dla oferty startowej, inne oprocentowanie, opłaty i daty dla drugiej oferty, rok przestępny oraz poprawne `offerId` w odpowiedzi.
- UI: loading/error, historia, URL, zachowanie formularza, szybkie zmiany wyboru, niezgodna wersja i stary klient.
- Uruchomić odpowiednie testy backendu i Angulara, lint, build Functions, build Angulara oraz smoke API/UI w emulatorach. Rozszerzyć istniejące skrypty smoke o dynamiczną ofertę; nie regenerować oczekiwanych wyników na podstawie badanego algorytmu.

Kolejność uruchomienia: konfiguracja bazy i uprawnień → import zweryfikowanej oferty startowej → kompatybilny backend → nowy frontend → kontrolowany import kolejnego miesiąca → aktywacja harmonogramu i alertów. Przygotować rollback katalogu do poprawnej wersji oraz możliwość zatrzymania importera bez usuwania historii.

Zaktualizować procedurę miesięczną: zwykła poprawna zmiana danych nie wymaga deploya; zmiana zasad obliczeń wymaga zmiany kodu i testów. Zachować ręczny import jako procedurę awaryjną.

## Podział prac

1. Rozpoznanie źródeł i infrastruktury — zamyka ryzyko parsera i wybór instancji.
2. Kontrakt, repozytorium, emulator i seed — daje trwałe wersje danych.
3. API v4 i parametryzacja obliczeń — zapewnia zgodność UI/backendu i historii.
4. Wybór oferty w UI — dostarcza funkcję użytkownikowi na danych startowych/testowych.
5. Importer, harmonogram i monitoring — automatyzuje dostarczanie kolejnych wersji.
6. Wdrożenie, dokumentacja i opcjonalny import starszych miesięcy.

## Źródła

- [Firebase: funkcje harmonogramowane i wymagania Cloud Scheduler](https://firebase.google.com/docs/functions/schedule-functions).
- [Oficjalna oferta obligacji](https://www.obligacjeskarbowe.pl/oferta/).
- [Oficjalne listy emisyjne](https://www.obligacjeskarbowe.pl/listy-emisyjne/).

Największa niewiadoma przed implementacją: stabilność automatycznego odczytu pełnych warunków z dokumentów źródłowych. Sam harmonogram i zapis danych są prostsze niż wiarygodne rozpoznanie zmian zasad emisji.
