# Plan modernizacji Oszczędzify

Data audytu: 21 października 2026 r. Stan wyjściowy: `main`, commit `6de87ec`.
Projekt Firebase: `personal-finance-2ee61`. Produkcja: <https://oszczedzify.org>.

Etapy 0 i 1 wykonano 21.10.2026; szczegóły w [raporcie bazowym](ETAP-0-RAPORT.md) i [raporcie etapu 1](ETAP-1-RAPORT.md). Etap 1 wdrożono do produkcyjnych Functions z commita `6d4b0c3`; testy produkcyjne przeszły. Hosting pozostał bez zmian. Etap 2 wdrożono 22.10.2026 z commita `caea9b4` do Functions i Hosting; [raport zmian](ETAP-2-RAPORT.md) i [kontrola produkcji](ETAP-2-WDROZENIE.md). Etap 3 zaimplementowano i sprawdzono lokalnie 22.10.2026; [raport etapu 3](ETAP-3-RAPORT.md). Użytkownik polecił commit i push 22.10.2026; etap oczekuje na polecenie publikacji. Podłączenie domeny `www` oraz kontrola Search Console pozostają do wykonania przy wdrożeniu.
Wersje pakietów należy ponownie sprawdzić na początku odpowiedniego etapu.

## Sposób pracy

1. Realizujemy jeden numerowany etap, następnie zatrzymujemy się na przegląd użytkownika.
2. Każdy etap kończy się opisem zmian, wynikiem istotnych testów i możliwością osobnego wdrożenia.
3. Wdrożenie produkcyjne wykonujemy na polecenie użytkownika. Nie commitujemy ani nie pushujemy bez wyraźnego polecenia.
4. Zachowujemy istniejące adresy publicznych stron i nazwy endpointów Functions. Ewentualne zmiany URL wymagają mapy przekierowań.
5. Nie łączymy zmiany wyników kalkulatorów z porządkowaniem architektury lub aktualizacją frameworka.
6. W przyszłych zmianach stosujemy oficjalny skill Angular, standalone, signals i zasady dostępności projektu. Nowe lub przebudowywane formularze po migracji do Angular 22 wykorzystują Signal Forms.

## Co ustalono

### Aplikacja i biblioteki

- Jedna aplikacja Angular 19.0.0, trzy kalkulatory, strony informacyjne oraz prosty blog z artykułami Markdown.
- Siedem bibliotek Nx: calculators, about-us, blog, layout, navigation, shared, ui. Brak drugiej aplikacji korzystającej z tych bibliotek.
- Nx 20.1.2 i część pakietów Nx 20.2.2 są niespójne wersjami.
- Backend eksportuje cztery funkcje HTTP: savings, regular contribution, treasury bonds, article. Obliczenia są zasadniczo czystym kodem TypeScript.
- Frontend używa bezpośrednich adresów HTTP Functions. Nie ma zależności od przeglądarkowego SDK `firebase` ani AngularFire.
- Functions deklarują Node 20. Faktyczny runtime wdrożonych funkcji trzeba odczytać w etapie 0.
- Google podaje 30.10.2026 jako termin wycofania runtime Node 20: po tej dacie aktualizacja funkcji na tym runtime będzie zablokowana. To nadaje aktualizacji runtime najwyższy priorytet.
- Istnieją testy obliczeń w Functions. Nie zostały jeszcze uruchomione w ramach tego audytu; ich obecność nie oznacza, że przechodzą lub weryfikują aktualną ofertę.

### SEO — sprawdzone na produkcji

- Strony kalkulatorów mają treść i H1 w początkowym HTML. Prerendering już istnieje; nie należy zakładać, że problemem jest wyłącznie renderowanie JavaScript.
- Sprawdzone podstrony mają taki sam `<title>Oszczędzify</title>`, opis i `og:url` wskazujący stronę główną.
- Brak canonicali i JSON-LD w sprawdzonych dokumentach HTML.
- `robots.txt` oraz `sitemap.xml` zwracają HTML aplikacji z HTTP 200, zamiast odpowiednich dokumentów.
- Przykładowy nieistniejący URL zwraca HTML aplikacji z HTTP 200. Reguła Firebase `** -> /index.html` sprzyja soft 404.
- Strona główna zwraca ogólny HTML bez H1; jej docelowe zachowanie wymaga poprawy.
- Wariant `www.oszczedzify.org` nie przeszedł walidacji certyfikatu TLS. W etapie SEO trzeba sprawdzić konfigurację domeny, DNS, certyfikatu i przekierowania na wersję bez `www`.
- Nie odczytano jeszcze raportów Search Console. Użytkownik potwierdził dostęp do zweryfikowanej usługi. Przyczyn i skali niskiej widoczności nie można rozstrzygnąć na podstawie samego kodu.

### Obligacje

- Parametry początkowego oprocentowania w kodzie są nieaktualne.
- Backend ma prawidłowe okresy ROS = 72 miesiące oraz ROD = 144 miesiące, ale tabela frontendu pokazuje odwrotne etykiety: ROD jako 6-letnie, ROS jako 12-letnie.
- Formularz zapisuje założenia w localStorage. Aktualizacja wartości domyślnych nie zmieni automatycznie zapisanych ustawień użytkowników.
- Inflacja, przyszła stopa NBP i oprocentowanie reinwestowanych środków są założeniami symulacji; nie powinny być prezentowane jako znane przyszłe parametry rynku.
- Trzeba osobno zweryfikować opłaty, podatek, zamianę, kapitalizację, moment wypłat, wcześniejszy wykup i założenia kupowania kolejnych emisji. Sama zmiana stóp procentowych nie wystarczy do potwierdzenia poprawności wyniku.

## Docelowa architektura

Rekomendacja: jedna aplikacja Angular zarządzana przez Angular CLI, z folderami według funkcji biznesowych, oraz osobny katalog backendu Firebase Functions w tym samym repozytorium.

```text
src/
  app/
    core/                  # konfiguracja, HTTP, SEO
    layout/                # nagłówek, stopka
    shared/                # rzeczywiście współdzielone elementy UI
    features/
      calculators/
        treasury-bonds/
        regular-contribution/
        long-term-savings/
      articles/
      about/
  styles.css
public/
functions/
  src/
    domain/                # czysty TypeScript: modele, oferta, obliczenia
    http/                  # adaptery HTTP i walidacja żądań
  content/
docs/
```

To propozycja docelowej organizacji, nie nakaz natychmiastowego przepisania wszystkich plików. W etapie 4 przenosimy frontend i usuwamy konfigurację Nx, utrzymując zachowanie. Granicę domain/HTTP backendu porządkujemy dopiero tam, gdzie wymaga tego aktualizacja obliczeń lub SDK.

- Nx i wydzielone projekty `libs` nie dają tutaj korzyści uzasadniających ich koszt utrzymania. Usuwamy je zamiast aktualizować do Nx 23.
- Zachowujemy lazy loading i podział na funkcje. Jedna aplikacja nie oznacza jednego wielkiego komponentu.
- Zachowujemy NgRx SignalStore podczas migracji; jego usunięcie nie jest warunkiem pozbycia się Nx.
- Zachowujemy Firebase Hosting i generowanie statycznego HTML. Miesięczne parametry oraz artykuły nie wymagają serwera SSR na każde żądanie.
- Ewentualne przeniesienie czystych obliczeń do przeglądarki i usunięcie części Functions to osobny, późniejszy etap po testach zgodności. Nie jest warunkiem tej modernizacji.

## Wersje i zależności

Stan z lockfile'ów; najnowsze wersje stabilne sprawdzono w rejestrze npm 21.10.2026. Celem są aktualne wersje zgodne z całym zestawem zależności, bez `--force` i `--legacy-peer-deps` jako sposobu obchodzenia konfliktów.

| Obszar | Obecnie | Sprawdzony cel / decyzja |
| --- | --- | --- |
| Angular, CLI, SSR, compiler | 19.0.0 | 22.2.3; migracje 19 → 20 → 21 → 22, osobne etapy |
| TypeScript frontendu | 5.5.4 | 6.0.3 dla Angular 22; latest 7.0.2 obecnie nie mieści się w peer dependency Angular build |
| NgRx Signals / Operators | 19.0.0 | 22.0.1, aktualizowane razem z odpowiednim majorem Angulara |
| Nx i `@nx/*` | 20.1.2 / 20.2.2 | Usunięcie; latest 23.3.0 nie jest potrzebny w docelowej aplikacji |
| Tailwind | 3.4.15 | 4.3.3 |
| daisyUI | 4.12.14 | 5.7.50, razem z Tailwind 4 |
| Tailwind Typography | 0.5.15 w manifestach | 0.5.20; sprawdzić współpracę z nowym CSS |
| PostCSS | 8.x | 8.5.31 oraz `@tailwindcss/postcss` w wersji zgodnej z Tailwind 4 |
| autoprefixer | 10.x | Usunąć, jeśli po migracji nie ma niezależnego zastosowania |
| Firebase Functions SDK | 6.1.0 | 7.4.0 |
| Firebase Admin SDK | 12.7.0 | 14.5.0 tylko jeżeli jest używany; w audycie nie znaleziono importów Admin SDK w źródłach |
| Firebase CLI | nieprzypięty w repo | Sprawdzone latest: 15.34.0; powtarzalna wersja narzędzia wdrożeniowego |
| Browser Firebase SDK | brak | Latest 13.1.0; nie dodawać bez potrzeby korzystania z usług SDK w przeglądarce |
| Zod | 3.23.8 | 4.6.7; sprawdzić walidację HTTP i danych localStorage |
| RxJS | 7.8.1 | 7.8.2; bez wersji beta 9 |
| Chart.js | 4.4.6 | 4.5.1 |
| Lodash | 4.17.21 | 4.18.1 albo usunięcie drobnych użyć na rzecz standardowego JS |
| Marked | 14.1.3 | 18.1.1; sprawdzić API renderera i obsługę treści artykułów |
| Express | 4.21.x | Usunąć nieużywany serwer SSR frontendu; rzeczywiste zależności/typy HTTP Functions dopasować do SDK, nie podnosić transitive Express wbrew SDK |
| Angular ESLint | 18.4.1 / schematics 19.x | 22.6.0 wraz z Angular 22 |
| ESLint | frontend 9.15, backend 8.57 | 10.13.0 po potwierdzeniu zgodności wszystkich wtyczek; przejściowo aktualne zgodne 9.x |
| TypeScript ESLint | różne 5.x / 8.x | 8.72.0 z właściwym zakresem TypeScript |
| Prettier | 3.3.3 | 3.9.10 |
| Testy frontendu | Jest 29.7 / preset 14.4 | Zachować przy usuwaniu Nx; po Angular 22 docelowo aktualny wspierany runner Angular (Vitest, sprawdzone 5.0.5), z przeniesieniem istniejących testów |
| Testy Functions | Mocha 10.8.2 | 12.0.3; zweryfikować deklarację i zgodność ts-node, nie utrzymywać niepotrzebnego firebase-functions-test |
| Typy Node | 18.16.9 | Wersja odpowiadająca wybranemu runtime, nie automatycznie latest 26.x |
| zone.js | 0.15.0 | Usunięcie po sprawdzeniu działania zoneless na Angular 22 |

Pozostałe pakiety `@angular/*`, `@angular-devkit/*`, `@schematics/angular`, typy, `tslib`, konfiguracje ESLint i narzędzia testowe aktualizujemy jako zgodne grupy. Pakiety SWC i narzędzia zależne wyłącznie od Nx usuwamy, jeżeli przestają być potrzebne. Audyt podatności jest osobną kontrolą; sprawdzenie wersji nie jest audytem bezpieczeństwa.

## Etapy do realizacji

### Etap 0 — pomiar stanu i przygotowanie bezpiecznych wdrożeń

Zakres:

- Odczytać historię wersji Hosting i stan czterech wdrożonych Functions: runtime, region, konfigurację oraz zgodność ze źródłami.
- Uruchomić istniejące istotne testy obliczeń, build produkcyjny oraz bazowe sprawdzenie wszystkich stron. Zapisać znane błędy osobno od oczekiwanego zachowania.
- Ustalić powtarzalne komendy start/build/test dla frontendu i Functions. Dodać konfigurację emulatora i wybór API local/staging/production bez edytowania adresów w kilku serwisach.
- Przygotować identyfikator wersji buildu, np. SHA + data + wersja danych oferty, aby w kolejnych wydaniach móc jednoznacznie powiązać produkcję ze źródłami. Dla lokalnych zmian uwzględnić oznaczenie dirty.
- W Search Console odczytać Skuteczność (3 i 16 miesięcy), Indeksowanie stron, mapy witryn, ręczne działania i inspekcję kluczowych URL. Zapisać indeksowanie, wyświetlenia, kliknięcia, CTR, zapytania i urządzenia.
- Odczyt Search Console przez zalogowaną sesję w przeglądarce; jeśli okaże się niedostępny, użyć eksportów raportów lub później skonfigurować dostęp API tylko do odczytu. Autoryzacja Firebase nie nadaje automatycznie uprawnień Search Console.

Odbiór: znany stan testów, raport SEO i procedura publikacji/odtworzenia wersji. Etap przygotowawczy nie wymaga produkcyjnego deploya; ewentualne metadane wersji opublikować z następnym wydaniem.

### Etap 1 — aktualizacja runtime Functions, pilne

Zakres:

- Przejść z zadeklarowanego Node 20 na Node 22, który jest obsługiwany przez obecny zestaw narzędzi i Google Cloud. Przypiąć zgodną lokalną wersję Node; lokalnie już jest 22.23.2.
- Node 24 jest także dostępnym stabilnym runtime dla Functions 2. generacji. Wybrać go zamiast 22 tylko po sprawdzeniu zgodności CLI i zależności; nie podnosić globalnie Node dla Angular 19 bez sprawdzenia jego macierzy zgodności.
- Naprawić tylko blokujące build/lint/deploy problemy. Nie zmieniać reguł finansowych ani jednocześnie wykonywać wszystkich major upgrade SDK.
- Zachować nazwy funkcji, regiony, ustawienia dostępu, kontrakty HTTP i CORS.

Odbiór: build i testy Functions, wywołania czterech endpointów w emulatorze oraz testy po wdrożeniu. Nie zakładamy możliwości powrotu do Node 20 po dacie jego wycofania.

Wdrożenie: Functions, bez zmiany frontendu poza ewentualnymi metadanymi z etapu 0.

### Etap 2 — aktualna oferta obligacji i poprawność kalkulatora

Zakres:

- Zweryfikować ofertę miesiąca wdrożenia w oficjalnych listach emisyjnych, a nie wyłącznie w marketingowym podsumowaniu.
- Wprowadzić jedną wersjonowaną konfigurację emisji: typ, symbol serii, miesiąc obowiązywania, oprocentowanie pierwszego okresu, marża, terminy wypłat/kapitalizacji, wcześniejszy wykup, zamiana i źródło.
- Pokazać miesiąc oferty oraz link do źródła na stronie. Zmiana miesiąca ma wymagać aktualizacji danych, bez zmieniania algorytmu.
- Naprawić etykiety ROS/ROD w tabelach, legendach i opisach oraz sprawdzić spójność z backendem.
- Zweryfikować naliczanie odsetek, opłaty, zaokrąglenia, podatek i zachowanie na granicach okresów. Testy mają porównywać wyniki z niezależnymi przykładami/listami emisyjnymi, a nie jedynie kopiować dotychczasowy algorytm.
- Rozróżnić aktualną ofertę zakupu od założeń przyszłych stóp, inflacji i reinwestycji w przyszłe emisje. Wyjaśnić ograniczenie dostępności obligacji rodzinnych.
- Poprawić walidację lat/miesięcy i zakresy API, sprawdzić użycie WIBOR dla stałoprocentowych TOS oraz pole skipTax, które nie jest przekazywane w żądaniu formularza.
- Wersjonować zapis localStorage; zachować świadomie wprowadzone założenia użytkownika i zapewnić reset do aktualnych ustawień.
- OTS 3-miesięczne są poza obecnym zakresem kalkulatora. Ich dodanie to opcjonalne rozszerzenie, nie warunek aktualizacji siedmiu istniejących typów.
- Przygotować checklistę miesięcznej aktualizacji. Automatyzacja może później przygotowywać propozycję zmiany, ale nie publikować niezweryfikowanych liczb samodzielnie.

Odbiór: testy pierwszego i kolejnego okresu, granic wykupu i przedterminowego zakończenia, podatku/opłat, scenariuszy inflacji i zgodności UI/API; sprawdzenie mobilnego formularza, tabeli i wykresu.

Wdrożenie: najpierw kompatybilne wstecz Functions, potem Hosting. Jeżeli potrzebna będzie zmiana niekompatybilnego kontraktu, najpierw wersjonujemy endpoint zamiast podmieniać zachowanie klientowi.

### Etap 3 — techniczne SEO

Zakres:

- Prawdziwy `robots.txt`, poprawny XML sitemap zawierający wyłącznie kanoniczne strony z HTTP 200, realistyczne `lastmod`.
- Unikalne title, description, canonical, og:title/description/url dla każdej publicznej strony; metadane obecne w prerenderowanym HTML.
- Jednoznaczna strona główna z treścią, H1 i linkami do trzech kalkulatorów; pełna lista tras do prerenderingu.
- Usunąć globalny fallback, który robi HTTP 200 dla nieistniejących stron; zachować bezpośrednie wejścia i odświeżanie poprawnych tras. Dodać rzeczywiste 404 i właściwe przekierowania, również dla nieistniejących artykułów.
- Ujednolicić HTTPS i domenę kanoniczną bez `www`. Sprawdzić dodatkowy adres Firebase Hosting: przekierowanie lub właściwe canonicale. Naprawa `www` może wymagać dostępu do operatora DNS.
- Dodać właściwe dla widocznej treści dane strukturalne, np. BreadcrumbList, Article lub WebApplication. Nie obiecywać wyników rozszerzonych FAQ ani sztucznych ocen.
- Zachować obecne URL kalkulatorów. Ewentualne polskie slugi rozważyć dopiero na podstawie danych, z przekierowaniami 301 i aktualizacją wszystkich linków.
- Zgłosić mapę witryny w Search Console oraz sprawdzić inspekcję kluczowych stron po publikacji.

Odbiór: kontrola surowego HTML bez JS, statusów 200/301/404, sitemap i robots, nawigacji po stronie klienta oraz metadanych po bezpośrednim wejściu. Preview musi mieć `noindex`, a produkcja nie może odziedziczyć tej blokady.

Wdrożenie: Hosting. Potem sprawdzenie inspekcji URL w Search Console; wzrost indeksowania i pozycji wymaga ponownego przetworzenia stron przez Google.

### Etap 4 — jedna aplikacja Angular CLI, bez Nx

Zakres:

- Przenieść kod z apps/libs do prostego układu src/app/features, core, shared i layout.
- Zastąpić cele Nx konfiguracją Angular CLI, zaktualizować aliasy, ścieżki TypeScript, style, public assets, testy i ścieżkę publikacji w firebase.json.
- Usunąć Nx Cloud, pakiety Nx, generatory i zależności używane wyłącznie przez Nx. Odłączyć konfigurację Tailwind od `createGlobPatternsForDependencies`, na razie zachowując Tailwind 3.
- Przenieść istotne istniejące testy Jest do konfiguracji działającej bez Nx. Nie zmieniać w tym samym kroku wszystkich runnerów.
- Zachować Angular 19, publiczne URL, HTTP API, wyniki obliczeń i wygląd. Usunąć tylko potwierdzony martwy kod; cztery Functions nadal są osobnym backendem w tym repo.

Odbiór: `npm start`, build produkcyjny z prerenderem, testy, smoke test trzech kalkulatorów i stron, poprawne zasoby na Hosting. Porównać wyniki i metadane z poprzednią wersją.

Wdrożenie: Hosting; Functions pozostają bez zmiany zachowania.

### Etap 5 — Angular 19 → 20

Zakres: oficjalne migracje Angular CLI/core/SSR oraz NgRx 20, zgodne wersje TypeScript, Angular ESLint i narzędzi budowania. Tailwind 3 i daisyUI 4 pozostają na tym etapie.

Odbiór: pełny build, testy, prerender, nawodnienie strony, localStorage, formularze i wykresy. Sprawdzić zgodność Node z obiema wersjami podczas migracji.

Wdrożenie: Hosting. Osobny punkt przeglądu przed etapem 6.

### Etap 6 — Angular 20 → 21

Zakres: kolejny oficjalny major upgrade, NgRx 21 i dopasowane narzędzia. Zachować zachowanie obliczeń i istniejące formularze podczas samej migracji.

Odbiór: te same kryteria co w etapie 5, z kontrolą zmian domyślnych ustawień Angulara.

Wdrożenie: Hosting. Osobny punkt przeglądu przed etapem 7.

### Etap 7 — Angular 21 → 22 i aktualny zestaw Angulara

Zakres:

- Angular/CLI/SSR 22.2.3, NgRx 22.0.1 i zgodny TypeScript 6.0.3; wersje dokładne ponownie potwierdzić przed pracą.
- Przejść na zoneless po sprawdzeniu formularzy, Chart.js, opóźnionego ładowania i aktualizacji widoku. Usunąć zone.js po udanym sprawdzeniu.
- Dopasować kod do domyślnego standalone/OnPush i nazewnictwa projektu przy dotykaniu plików; uniknąć masowego przepisywania całej aplikacji bez potrzeby.
- Skonfigurować wspierany runner Angular/Vitest i przenieść istniejące testy frontendu, zamiast utrzymywać równolegle zbędne zestawy testowe.
- Nowe lub przebudowywane formularze tworzyć w Signal Forms. Masową konwersję wszystkich działających formularzy traktować jako osobny opcjonalny etap, jeśli przekroczy zakres migracji.

Odbiór: build, testy, prerender, brak błędów hydration, działające UI po zmianach asynchronicznych i kontrola dostępności kluczowych widoków.

Wdrożenie: Hosting.

### Etap 8 — Tailwind 4 + daisyUI 5

Zakres:

- Wspólna migracja Tailwind 3 → 4 oraz daisyUI 4 → 5 zgodnie z oficjalnymi przewodnikami.
- Konfiguracja CSS-first, właściwy plugin PostCSS, migracja motywu kolorystycznego i sprawdzenie wykrywania klas.
- Tailwind 4 nie jest projektowany do pracy jako część pipeline Sass; rozdzielić główny CSS Tailwind od ewentualnego pozostawionego SCSS, zamiast mechanicznie podmienić numer pakietu.
- Sprawdzić zmiany klas komponentów, focus, rozmiary inputów, akordeony, menu i responsywne tabele. Zachować charakter wizualny bez równoległego redesignu.
- Usunąć zbędne stare presety i autoprefixer, jeżeli nie ma innych zastosowań.

Odbiór: porównanie wizualne desktop/mobile, test klawiaturą, kontrasty WCAG AA i brak naruszeń axe w badanych widokach/stanach, sprawdzenie wykresów i stanów błędu/ładowania.

Wdrożenie: Hosting, po przeglądzie wizualnym.

### Etap 9a — Firebase SDK i zależności backendu

Zakres:

- Firebase Functions SDK 7.x, używany Admin SDK 14.x lub usunięcie nieużywanego pakietu; zgodny runtime i typy Node.
- Zaktualizować narzędzia testowe backendu do zgodnych wersji, zachowując testy domeny; przenieść konieczne poprawki lint/deploy przed wdrożeniem SDK.
- Uporządkować typy HTTP zgodnie z Firebase Functions. Nie dodawać Firebase SDK w przeglądarce, jeśli nadal wystarcza HTTP.

Odbiór: testy domeny, kontrakty i błędy API, build/lint obu części, emulator, kalkulatory i artykuły, brak konfliktów peer dependencies.

Wdrożenie: Functions. Osobny punkt przeglądu przed etapem 9b.

### Etap 9b — Zod 4 i walidacja

Zakres: Zod 4 we frontendzie i Functions, walidacja HTTP, błędy API, format i migracja zapisów localStorage. Zachować zgodność poprawnych żądań dotychczasowych klientów.

Odbiór: testy poprawnych i błędnych danych, granic zakresów oraz starszych zapisów użytkownika.

Wdrożenie: kompatybilny backend, następnie Hosting. Osobny punkt przeglądu przed etapem 9c.

### Etap 9c — pozostałe biblioteki i narzędzia

Zakres: aktualizacja Marked, Chart.js, RxJS, Lodash i pozostałych używanych pakietów; uporządkowanie ESLint/TypeScript ESLint i Prettier. Konfiguracja backendu obecnie miesza składnię konfiguracji płaskiej i legacy. Usunąć martwe zależności i sprawdzić podatności produkcyjne oraz narzędziowe. Nie używać automatycznego `audit fix --force`.

Odbiór: build/lint obu części, testy domeny, wykresy, artykuły i brak konfliktów peer dependencies. Jeśli zostają wyjątki zgodności, udokumentować ich przyczynę i warunek usunięcia.

Wdrożenie: Functions i/lub Hosting według faktycznie zmienionej części.

### Etap 10 — treść i dalszy wzrost SEO

Zakres:

- Na podstawie raportów GSC wybrać zapytania i strony do poprawy; oddzielić problem indeksowania od niskich pozycji, małej liczby wyświetleń i słabego CTR.
- Poprawić czytelne opisy kalkulatorów: dane wejściowe, metodologia, przykłady, ograniczenia, źródła i data aktualizacji. Dodać autora/opiekuna treści oraz przydatne powiązania między stronami.
- Rozstrzygnąć nakładanie się artykułu `/kalkulator-obligacji-skarbowych` i strony narzędzia: różne intencje i linkowanie albo konsolidacja z 301; decyzja po danych GSC.
- Zmierzyć Core Web Vitals i wagę JS; zoptymalizować wykresy, ładowanie skryptów i ewentualne opóźnienia API na podstawie pomiarów. Nie utożsamiać wyniku Lighthouse z pozycją w Google.
- Porównać indeksowanie i ruch po 2–4 oraz 6–8 tygodniach, uwzględniając opóźnienia GSC, sezonowość i niewielką liczbę danych. Bez gwarancji konkretnej pozycji lub wzrostu.

Odbiór: udokumentowane zmiany treści i raport przed/po. Monitoring nie wymaga odkładania pozostałych etapów o kilka tygodni.

Wdrożenie: Hosting po każdej zamkniętej, sprawdzonej partii zmian treści.

## Referencyjna oferta obligacji — październik 2026

Poniższe stopy to wartości roczne. Dla ROR/DOR dotyczą pierwszego miesiąca; dla COI/EDO/ROS/ROD pierwszego roku. TOS ma stałą stopę w okresie trzech lat.

| Typ | Okres | W kodzie: pierwsza stopa | Oferta 10/2026 | Kolejne okresy |
| --- | --- | --- | --- | --- |
| ROR | 1 rok | 5,75% | 4,00% | stopa referencyjna NBP + 0,00 p.p. |
| DOR | 2 lata | 5,90% | 4,15% | stopa referencyjna NBP + 0,15 p.p. |
| TOS | 3 lata | 5,95% | 4,40% | stałe oprocentowanie |
| COI | 4 lata | 6,30% | 4,75% | inflacja + 1,50 p.p. |
| EDO | 10 lat | 6,55% | 5,35% | inflacja + 2,00 p.p. |
| ROS | 6 lat | 6,50% | 5,00% | inflacja + 2,00 p.p. |
| ROD | 12 lat | 6,80% | 5,60% | inflacja + 2,50 p.p. |

Źródła: [MF — oferta październik 2026](https://www.gov.pl/web/finanse/oferta-oszczednosciowych-obligacji-skarbowych---pazdziernik-2026-r) oraz [PKO BP — oferta październik 2026](https://www.bm.pkobp.pl/aktualnosci/nowa-oferta-obligacji-skarbu-panstwa-pazdziernik-2026).

W komunikacie MF część symboli w tabeli nie odpowiada miesiącowi w nagłówku. Przed implementacją identyfikatory emisji i szczegółowe opłaty należy potwierdzić w listach emisyjnych. Przy wdrożeniu w listopadzie trzeba już zweryfikować ofertę listopadową.

## Procedura publikacji i odtworzenia wersji

- Każde wydanie: zakres → build i istotne testy → preview lub emulator → przegląd użytkownika → polecenie wdrożenia → test produkcji i zapis identyfikatorów wersji.
- Hosting preview nie tworzy osobnego środowiska Functions. Dla zmian backendu potrzebny jest emulator albo osobny projekt staging; należy świadomie wskazać backend używany przez preview.
- Obecny CORS dopuszcza localhost i produkcję, ale nie dowolne kanały preview. Skonfigurować konkretne dozwolone adresy testowe, zamiast otwierać wszystkie originy.
- Hosting: zachować poprzedni release i możliwość przywrócenia go. W miarę możliwości promować dokładnie zweryfikowany artefakt preview, bez ponownego budowania innej wersji.
- Functions: odtworzenie poprzedniej wersji oznacza ponowne wdrożenie poprzedniego kodu i zgodnej konfiguracji na obsługiwanym runtime; nie zakładamy odpowiednika przycisku rollback Hosting.
- Zapisać wersję oferty i wersję API; obie muszą być spójne z HTML generowanym podczas budowania oraz z cache klienta.
- Produkcyjne testy po wdrożeniu obejmują poprawne URL, kalkulatory, aktualny miesiąc danych, metadane oraz statusy 404. Po zmianie Functions sprawdzić też logi błędów i czasy odpowiedzi.

## Dodatkowe źródła decyzji

- [Angular — macierz zgodności](https://angular.dev/reference/versions), [oficjalny przewodnik aktualizacji](https://angular.dev/update-guide), [oficjalne skille](https://angular.dev/ai/agent-skills).
- Wersje pakietów: metadane oficjalnego rejestru npm, m.in. [Angular core](https://registry.npmjs.org/@angular%2fcore/latest), [Tailwind](https://registry.npmjs.org/tailwindcss/latest), [daisyUI](https://registry.npmjs.org/daisyui/latest), [Functions SDK](https://registry.npmjs.org/firebase-functions/latest).
- [Tailwind 4 — migracja](https://tailwindcss.com/docs/upgrade-guide), [daisyUI 5 — migracja](https://daisyui.com/docs/upgrade/).
- [Google Cloud — terminy wsparcia runtime](https://docs.cloud.google.com/functions/docs/runtime-support#node.js), [Firebase — zarządzanie Functions](https://firebase.google.com/docs/functions/manage-functions).
- [Google Search — JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [Search Console — uprawnienia](https://support.google.com/webmasters/answer/7687615?hl=pl).
- [Firebase Hosting — kanały preview](https://firebase.google.com/docs/hosting/test-preview-deploy).
