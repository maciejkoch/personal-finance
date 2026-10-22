# Etap 3 — techniczne SEO

Stan: 22.10.2026. Hosting wdrożono z commita `706fc76`; [kontrola produkcji](ETAP-3-WDROZENIE.md). Testy produkcyjne przeszły, Search Console przyjął sitemapę i wykrył siedem stron. Rekord DNS `www` zmieniono na wymagany CNAME; Firebase potwierdził własność domeny, a testy HTTPS i 301 dla siedmiu stron przeszły. Etap 3 zakończono. Bazowy commit implementacji: `1150d6d`. Functions nie zostały zmienione.

## Zmiany

- Strona `/` ma treść, jeden H1, trzy opisane kalkulatory i linki do istniejących artykułów. Zastępuje tymczasowe przekierowanie do obligacji; zachowuje obecny styl serwisu.
- Rejestr `apps/personal-finance/src/app/seo/pages.json` obejmuje siedem kanonicznych stron. Z niego powstają lista tras prerenderingu, sitemap i metadane. Dodanie artykułu wymaga wpisu w rejestrze; przygotowanie buildu porównuje go z plikami Markdown.
- Angular `TitleStrategy` ustawia osobne title, description, canonical, Open Graph i Twitter dla każdej strony, również po nawigacji klienta. Canonicale wskazują HTTPS bez `www`, bez parametrów i fragmentów.
- Metadane i treść są obecne w początkowym HTML. Siedem publicznych stron oraz dokument błędu są prerenderowane. Build kończy się błędem, jeżeli którejś stronie brakuje H1 lub oczekiwanego tytułu, np. przy nieudanym pobraniu artykułu.
- JSON-LD: `WebApplication` dla kalkulatorów, `Article` dla istniejących artykułów, `WebPage` dla strony głównej i `AboutPage` dla informacji o serwisie. Nie dodano ocen, FAQ ani niepotwierdzonych dat i autorów artykułów.
- `robots.txt` jest tekstem, `sitemap.xml` poprawnym dokumentem XML z siedmioma kanonicznymi URL. `lastmod` jest ręczną datą istotnej zmiany treści/metadanych: obecnie 2026-10-22. Build nie zastępuje jej bieżącą datą; przy miesięcznej zmianie oferty należy zaktualizować wpis kalkulatora obligacji.
- Usunięto globalny rewrite i przekierowania nieznanych tras do kalkulatora. Firebase serwuje pliki poszczególnych stron, a brakujące adresy dostają własną stronę z HTTP 404 i `noindex`.
- Istniejące dwa slugi artykułów są trasami jawnymi. Nieistniejący artykuł nie otwiera już pustego komponentu oczekującego odpowiedzi API.
- `/calculators` i `/calculators/` zwracają 301 do dotychczasowego kalkulatora obligacji. Hosting normalizuje końcowy slash i adresy `index.html`. Angular używa standardowego przekierowania pustej trasy kalkulatorów, także z query string.
- Strona „O nas” dostała H1 zamiast początkowego H2.

## Preview i dodatkowe domeny

`npm run preview:prepare` kopiuje gotowy build do `dist/hosting-preview` oraz tworzy `dist/firebase.preview.json`. Kopia ma meta robots `noindex, follow` i nagłówek `X-Robots-Tag` dla wszystkich odpowiedzi. Pliki produkcyjne pozostają bez zmian. Do ewentualnego kanału preview należy wskazać ten osobny config, a nie główny `firebase.json`.

Wariant staging i lokalny mają `seoIndexable: false`. W przeglądarce każdy host inny niż `oszczedzify.org` utrzymuje `noindex` również po nawigacji. Dodatkowe domeny Firebase dostaną canonicale prowadzące do domeny właściwej już w surowym HTML. Nie dodano przekierowania wszystkich hostów w `firebase.json`, ponieważ reguły ścieżek dotyczą również domeny właściwej.

Produkcja dopuszcza w CORS m.in. `http://localhost:4200`, lecz nie origin emulatora Hostingu `http://127.0.0.1:5051` ani dowolne kanały preview. Dlatego test surowego HTML działa na emulatorze Hostingu, a nawigację z pobieraniem danych zweryfikowano na istniejącym dev serverze `localhost:4200` z lokalnymi Functions. Pełny test API na opublikowanym preview wymaga odrębnego backendu staging lub dopuszczenia konkretnego originu. Ten etap nie zmienia produkcyjnego CORS ani Functions.

## Domena www — diagnoza do wdrożenia

Odczyt DNS i Firebase Hosting API 22.10.2026:

| Sprawdzenie | Wynik |
| --- | --- |
| `http://oszczedzify.org/` | 301 do HTTPS |
| `oszczedzify.org` A | `199.36.158.100` |
| `www.oszczedzify.org` A | `199.36.158.100` |
| AAAA / CNAME obu hostów | Brak |
| Custom domains w Firebase | Tylko `oszczedzify.org`: HOST_ACTIVE, OWNERSHIP_ACTIVE, CERT_ACTIVE |
| TLS `www.oszczedzify.org` | ERR_TLS_CERT_ALTNAME_INVALID; certyfikat domyślnej domeny Firebase |

Przyczyna: `www` wskazuje Firebase w DNS, ale nie jest podłączone jako custom domain. Przy publikacji należy dodać `www.oszczedzify.org` do tego samego site z `redirectTarget: "oszczedzify.org"`, wykonać ewentualną dodatkową weryfikację DNS wskazaną przez Firebase i poczekać na aktywację certyfikatu. Następnie sprawdzić TLS oraz 301 z zachowaniem ścieżki i query. Sam deploy plików nie podłącza domeny. Dokumentacja: [custom domains i redirectTarget](https://firebase.google.com/docs/reference/hosting/rest/v1beta1/projects.sites.customDomains).

## Weryfikacja

- `env -u NODE_TLS_REJECT_UNAUTHORIZED npm run build -- --skip-nx-cache` — OK, osiem prerenderowanych tras; finalizacja tworzy `404.html`, usuwa katalog technicznego prerenderu `/404` i nieużywany `index.csr.html`.
- `npm test` — OK dla ośmiu projektów Nx z testami lub istniejącym ustawieniem dopuszczającym brak testów. Cztery nowe testy SEO używają rzeczywistego routera: zmiana metadanych, query/hash, usunięcie canonicala i JSON-LD na 404, `noindex` staging oraz hostów podglądu.
- `node scripts/smoke-hosting.mjs http://127.0.0.1:5051` — OK: siedem stron 200 z pojedynczym H1 i kompletem metadanych/JSON-LD, przekierowania 301, błędne adresy 404, robots i sitemap z właściwymi typami treści. Test nie wykonuje JavaScript.
- Ten sam smoke z `--preview` na kopii preview — OK, meta i nagłówek `noindex`; produkcyjny HTML nadal ma `index, follow`.
- Przeglądarka: strona główna na desktopie i 390 × 844, brak poziomego przewijania. Kliknięcie do kalkulatora aktualizuje canonical, title i JSON-LD. Nawigacja do artykułu na dev serverze ładuje treść i poprawne metadane bez błędów konsoli. Bezpośrednie wejście na brakującą stronę zachowuje widok 404 po uruchomieniu Angulara.
- Istniejące ostrzeżenia buildu: stara baza Browserslist, Lodash CommonJS, selektory daisyUI `.tooltip:has()` i konfiguracja sourceRoot Functions. Nie blokują buildu; porządkowanie zależności pozostaje w dalszych etapach.

## Publikacja po przeglądzie

1. Commit i push na polecenie użytkownika.
2. Build bez cache, kontrola wersji buildu i ponowny smoke artefaktu. Opublikować tylko Hosting; Functions pozostają bez zmian.
3. Uruchomić `npm run smoke:hosting` na produkcji oraz sprawdzić działanie formularzy, nawigację i konsolę w przeglądarce z prawidłowym originem.
4. Podłączyć `www` jako domenę przekierowującą; sprawdzić aktywację certyfikatu i 301. Nie oznaczać tego punktu jako zakończonego przed testem HTTPS.
5. W zweryfikowanej usłudze Search Console zgłosić `https://oszczedzify.org/sitemap.xml`, odczytać wynik zgłoszenia oraz inspekcję strony głównej i trzech kalkulatorów. Nie zgłaszać zmian przed ich publikacją i nie utożsamiać zgłoszenia z indeksacją.
6. Zapisać identyfikator wydania Hostingu i wyniki kontroli produkcji. Dopiero wtedy domknąć etap 3.
