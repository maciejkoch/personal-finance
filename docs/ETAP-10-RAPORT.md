# Etap 10 — treści, linkowanie i wydajność

Data: 23.10.2026. Baza: `5a2a0e9`, katalog roboczy był czysty. Partię opublikowano z commita `41c1a05`, a poprawkę tabeli z `76e165b`, po poleceniu użytkownika wykonania commita, pusha i deploya. [Kontrola produkcji](ETAP-10-WDROZENIE.md). Etap pozostaje otwarty w zakresie nowych danych GSC i obserwacji po publikacji. [Wyniki maszynowe](baseline/2026-10-23-stage10-checks.json).

## Treść i intencja stron

- Trzy kalkulatory mają opis danych wejściowych, metody, przykładu, ograniczeń, źródeł i opiekuna treści. Opisy znajdują się w prerenderowanym HTML, poza odroczonymi formularzami. Nagłówki i wstępy jasno określają przeznaczenie narzędzia.
- Wyjaśniono wpłaty na koniec miesiąca, miesięczną kapitalizację oraz uproszczenie podatku w kalkulatorach regularnego oszczędzania i celu. Oba zaczynają od zerowego kapitału. Usunięto mylącą wzmiankę o kapitale początkowym z opisu SEO celu; dodanie obsługi kapitału początkowego nie było częścią tej zmiany.
- Opis obligacji odpowiada rzeczywistemu formularzowi: pełne lata 1–12. Przykład 100 zł → 111,16 zł netto dotyczy jawnie historycznej serii TOS1029 i ma bezpośredni link do jej listu. Przy zmianie miesiąca oferty nie zmieni automatycznie etykiety na nową emisję.
- Poprawiono poradnik `/kalkulator-obligacji-skarbowych`: indeksacja od drugiego roku, coroczna wypłata COI, kapitalizacja EDO i wypłata przy wykupie. Usunięto obietnicę pewnej ochrony siły nabywczej oraz ogólne twierdzenie o corocznej wypłacie wszystkich obligacji. Zasady zweryfikowano w oficjalnych opisach [COI](https://www.obligacjeskarbowe.pl/oferta-obligacji/obligacje-4-letnie-coi/) i [EDO](https://www.obligacjeskarbowe.pl/oferta-obligacji/obligacje-10-letnie-edo/).
- Oba artykuły i narzędzia wzajemnie się linkują. Poradnik regularnego oszczędzania prowadzi od budżetu do przykładowej symulacji. „O serwisie” wyjaśnia opiekę nad treścią i sposób aktualizacji oferty. Opiekun jest oznaczony jako Oszczędzify, bez przypisywania autorstwa konkretnej osobie ani niepotwierdzonych kwalifikacji.
- Daty aktualizacji treści, sitemap `lastmod` i JSON-LD są zgodne; dodano autora typu Organization dla artykułów i maintainer dla narzędzi. Data weryfikacji oferty pozostaje osobnym polem. Strona główna zachowuje dotychczasowe `lastmod`, ponieważ jej treść nie była zmieniana.

Adresy pozostają bez zmian. Poradnik obsługuje intencję informacyjną „jak działają COI/EDO”, a `/calculators/treasury-bonds` — obliczenie i porównanie kwot. To zachowawcza decyzja do czasu nowych danych; nie jest dowodem braku kanibalizacji. Nie dodano przekierowania 301 ani wspólnego canonicala.

## Prerender artykułów

Poprzedni build pobierał artykuły z produkcyjnej Function. W efekcie zmiana Markdown w checkoutcie nie była widoczna w lokalnym HTML produkcyjnego buildu przed wdrożeniem backendu.

Serwerowy dostawca `PrerenderArticleDataService` czyta teraz zarejestrowane artykuły z lokalnego `functions/content` i używa tej samej wersji Marked co backend: 18.1.1. Marked dodano jako zależność developerską frontendu; nie trafia do paczek przeglądarki. Brak lokalnego pliku przerywa prerender zamiast cicho publikować starą treść. Allowlista publicznych artykułów ogranicza odczyty do znanych slugów.

TransferState przenosi treść do hydratacji bez pierwszego żądania API. Późniejsze wejścia przez nawigację klienta nadal korzystają z API właściwego dla środowiska. Kontrakt Function i jej publiczna nazwa pozostają bez zmian. Po publikacji samego Hostingu kolejne przejścia mogłyby odczytać starszą treść API — dlatego najpierw należy wdrożyć `articleHttpFunction`.

## Pomiar bazowy i zmiany wydajności

[PageSpeed Insights — mobile, produkcyjne obligacje](https://pagespeed.web.dev/analysis/https-oszczedzify-org-calculators-treasury-bonds/qt2kzjtkoq?form_factor=mobile), 23.10.2026, 09:17 CEST. Lighthouse 13.5.0, emulowany Moto G Power, Slow 4G. Jest to pojedynczy pomiar laboratoryjny sprzed zmian:

| Metryka                                            | Wynik                                      |
| -------------------------------------------------- | ------------------------------------------ |
| Performance / Accessibility / Best Practices / SEO | 97 / 100 / 100 / 100                       |
| FCP / LCP / Speed Index                            | 0,8 s / 2,4 s / 1,6 s                      |
| TBT / CLS                                          | 140 ms / 0,004                             |
| Dane rzeczywistych użytkowników                    | Brak danych                                |
| Szacowane oszczędności niewykorzystanego JS        | 168 KiB, w tym 67,9 KiB Google Tag Manager |
| Szacowane oszczędności cache                       | 234 KiB; własne JS/CSS miały TTL 1 godz.   |

Brak danych terenowych oznacza, że nie potwierdzono spełnienia Core Web Vitals ani INP. TBT nie zastępuje INP. Zgodnie z [dokumentacją Google](https://developers.google.com/search/docs/appearance/core-web-vitals) CWV opisują doświadczenia rzeczywistych użytkowników; wynik Lighthouse nie jest prognozą pozycji w wyszukiwarce. Publiczne API PSI zwróciło 429 z limitem dziennym 0; powyższy raport uzyskano przez interfejs WWW PSI.

Na podstawie pomiaru:

- Zastąpiono `chart.js/auto` rejestracją używanych kontrolerów liniowych/słupkowych, skal, elementów, legendy i tooltipów zgodnie z [dokumentacją Chart.js](https://www.chartjs.org/docs/latest/getting-started/integration.html). Odroczone wykresy pobierają kod po wejściu w viewport; usunięto ich prefetch podczas idle. Miejsca zastępcze rezerwują wysokość, a instancje obu wykresów słupkowych są zwalniane po opuszczeniu strony.
- Dodano roczny `Cache-Control: public,max-age=31536000,immutable` wyłącznie dla JS/CSS z ośmioznakowym hashem. HTML i niewersjonowane obrazy nie dostają `immutable`; `version.json` nadal ma `no-store`. Zmiana korzysta z reguł nagłówków [Firebase Hosting](https://firebase.google.com/docs/hosting/full-config#headers).
- Pozostawiono dotychczasowy pomiar Google Analytics. Nie zmieniano konfiguracji runtime ani płatnych ustawień skalowania Functions.

Porównanie lokalnych buildów tej samej bazy, Node 22.23.2, `--stats-json`; gzip z Node, nie rozmiar przesyłu raportowany przez CDN:

| Zasób                           |       Przed |                  Po |
| ------------------------------- | ----------: | ------------------: |
| Chunk zawierający Chart.js, raw |   205 843 B | 173 070 B (−15,92%) |
| Ten sam chunk, gzip             |    70 923 B |            60 518 B |
| Wszystkie paczki JS, raw        | 1 121 110 B |         1 100 771 B |
| Zestaw początkowy JS/CSS        |   456,74 kB |           458,50 kB |

Treść i metadane zwiększają nieco zestaw początkowy, a optymalizacja dotyczy głównie kodu ładowanego później. Wyniki dwóch pomiarów PSI po publikacji zapisano w [kontroli produkcji](ETAP-10-WDROZENIE.md). Największy lazy chunk, zawierający m.in. Zod, pozostaje poza zakresem tej partii.

Trzy sekwencyjne żądania do każdego produkcyjnego API, ze stałymi danymi przykładowymi:

| Kalkulator       | Żądanie 1 | Żądanie 2 | Żądanie 3 |
| ---------------- | --------: | --------: | --------: |
| Cel              |   3478 ms |    215 ms |    160 ms |
| Regularne wpłaty |   2838 ms |    162 ms |    165 ms |
| Obligacje        |   2142 ms |    161 ms |    169 ms |

Wszystkie odpowiedzi miały HTTP 200. Czasy obejmują sieć z komputera developerskiego; nie ustalono, czy pierwsze żądania trafiły w cold start. Próba nie uzasadnia zmiany regionu czy włączenia płatnych minInstances. Opóźnienia uwzględniające rzeczywistych użytkowników pozostają do dalszej obserwacji.

## Odbiór lokalny

| Sprawdzenie                                     | Wynik                                                                                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Frontend `npm test`                             | 38 testów, 12 zestawów                                                                                                    |
| Functions `npm run test:functions`              | 44 testy                                                                                                                  |
| Lint frontendu i Functions, typy testów         | OK                                                                                                                        |
| Produkcyjny build z `--stats-json`              | OK, 8 prerenderowanych tras                                                                                               |
| `npm run check:content`                         | 7 stron: metody, daty, opiekun, linki; oba Markdown identyczne z HTML i TransferState; Marked poza JS przeglądarki        |
| `smoke:hosting` na emulatorze                   | 200/301/404, metadane, canonicale, JSON-LD, robots, sitemap, nagłówki cache OK                                            |
| Nagłówki wszystkich plików JS/CSS na emulatorze | Roczny immutable; `version.json` no-store                                                                                 |
| `smoke:api -- --contracts`                      | 4 endpointy, walidacja i CORS OK                                                                                          |
| `smoke:bonds`                                   | Przykłady wykupu, podatek i błędne dane OK                                                                                |
| Przeglądarka                                    | Formularze, linki, wykres słupkowy i liniowy oraz artykuł po bezpośrednim wejściu OK; sprawdzona sesja bez błędów konsoli |
| `git diff --check`                              | OK                                                                                                                        |

W UI potwierdzono: 500 zł / 2 lata / 5% → 12 480,30 zł netto; 600 zł → 14 976,36 zł. Cel 10 000 zł / 2 lata / inflacja 3% / stopa 5% → 425,03 zł miesięcznie; pominięte obie stopy → 416,67 zł. Jedna TOS / 3 lata → 111,16 zł w tabeli.

Przeglądarka miała faktyczną szerokość 706 px, bez poziomego poszerzenia dokumentu w sprawdzonym widoku. Próba ustawienia 390 × 844 nie zmieniła rzeczywistego viewportu; testu 390 px nie oznaczamy jako zaliczonego. Do odbioru wizualnego pozostaje kontrola na telefonie lub w przeglądarce z działającą emulacją. Nie wykonywano nowego pełnego audytu axe ani WCAG. Kontrola Prettier ujawniła stare formatowanie dwóch nietkniętych plików `calculators/shell` oraz istniejących dokumentów README i planu (potwierdzone także dla HEAD). Nie wykonywano ich masowego formatowania; nowe pliki i zmienione źródła przechodzą kontrolę.

## GSC i dalszy odbiór

Zalogowana sesja Chrome jest niedostępna: narzędzie zwróciło „Computer Use permissions are not granted”. Nie odczytano nowej skuteczności ani indeksowania. Znany punkt bazowy z 21.10: 1 kliknięcie i 15 wyświetleń w 16 miesięcy, wyłącznie strona główna, bez wierszy zapytań; jeden URL zindeksowany. Dnia 22.10 sitemap miała stan Sukces i 7 wykrytych stron; testy opublikowanych kalkulatorów potwierdziły dostępność dla Google, ale inspekcja indeksu nadal wskazywała nieznane URL. Źródła: [raport bazowy](ETAP-0-RAPORT.md) i [kontrola etapu 3](ETAP-3-WDROZENIE.md).

Przy tak małej próbie i po jednym dniu od naprawy odkrywania URL nie ma podstaw do wyboru konkretnych fraz, przypisywania problemu CTR ani konsolidacji adresów. Treści dobrano do rzeczywistych funkcji narzędzi, bez udawania analizy nowych zapytań.

Po uzyskaniu dostępu do GSC należy zapisać skuteczność 3 i 16 miesięcy według strony, zapytania i urządzenia, aktualizację raportu indeksowania, status sitemapy i inspekcję trzech kalkulatorów. Najpierw ocenić odkrywanie i indeksowanie, potem pozycje, a CTR porównywać dla podobnych zapytań i pozycji. Osobno zestawić obie strony obligacji dla wspólnych zapytań.

Procedura publikacji i dalszego odbioru (publikację oraz kontrolę produkcji wykonano — [raport](ETAP-10-WDROZENIE.md)):

1. Wdrożyć zmienioną treść `articleHttpFunction`, sprawdzić oba slugi i 404. Pozostałe Functions nie wymagają zmiany algorytmu.
2. Opublikować sprawdzony Hosting i nagłówki. Sprawdzić `version.json`, formularze, oba wykresy, artykuły po bezpośrednim wejściu i nawigacji, cache oraz smoke SEO.
3. Powtórzyć PSI w porównywalnych warunkach. Wyniku sprzed i po wdrożeniu nie traktować jako dowodu wpływu na ruch.
4. Po 2–4 i 6–8 tygodniach porównać GSC i dostępne dane terenowe, notując opóźnienie raportów i sezonowość. Gdyby publikacja nastąpiła 23.10, okna kontroli przypadają 6–20.11 oraz 4–18.12.2026; przy innej dacie przesunąć je od dnia faktycznej publikacji.

Nie utworzono automatyzacji monitoringu. Aktualne GSC, kontrola 390 px i długoterminowe porównania pozostają otwarte. Publikacja oraz dwa laboratoryjne pomiary po publikacji zostały wykonane.
