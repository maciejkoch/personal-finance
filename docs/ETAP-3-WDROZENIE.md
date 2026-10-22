# Etap 3 — publikacja i kontrola produkcji

Data: 22.10.2026. Wdrożono wyłącznie Firebase Hosting projektu `personal-finance-2ee61`. Functions pozostają bez zmian.

## Opublikowana wersja

- Źródła: `706fc76008e302ccdecf12726ddae69a1016d4cf`, czysty katalog roboczy podczas buildu.
- Build: `706fc76-2026-10-22T06:31:27.914Z`, API production, oferta `2026-10-v1`, obliczenia v2.
- Hosting version: `20aa0338c455f50e`.
- Release: `1792650770329000`, 22.10.2026, 06:32:50 UTC.
- Identyczny `version.json` w lokalnym artefakcie i pod `https://oszczedzify.org/version.json`.
- Build bez cache i test surowego HTML na emulatorze przeszły przed publikacją.

## Kontrola produkcji

`npm run smoke:hosting` przeszedł: siedem kanonicznych stron ma HTTP 200, pojedynczy H1, własny tytuł i opis, canonical, Open Graph i JSON-LD w początkowym HTML. Strona główna ma linki do trzech kalkulatorów. `/calculators` oraz warianty z końcowym slashem mają oczekiwane 301. Nieistniejące artykuły i trasy kalkulatorów zwracają rzeczywiste HTTP 404 z własną treścią i `noindex`.

`robots.txt` zwraca `text/plain`, a `sitemap.xml` — `application/xml` i siedem kanonicznych URL. Produkcyjny build nie ma `noindex` na prawidłowych stronach.

Produkcja i emulator różnią się obsługą samego dokumentu błędu: przy `cleanUrls` Firebase publikuje plik `404.html` również jako `/404` z HTTP 200. To techniczny dokument z `noindex`, bez canonicala i poza sitemapą. Emulator zwraca pod tym adresem 404. Test smoke rozróżnia ten znany dokument od dowolnych nieistniejących adresów, dla których nadal bezwzględnie wymaga 404. Zmiana testu po publikacji nie zmienia wdrożonego frontendu.

W przeglądarce potwierdzono nową stronę główną, nawigację do kalkulatora obligacji, aktualizację title/canonical i `index, follow`, pobranie wyników oraz przeliczenie liczby obligacji 100 → 101. Tabela i wykres pozostają dostępne; konsola bez błędów. Przywrócono 100 obligacji.

## Search Console

W usłudze domenowej `sc-domain:oszczedzify.org` zgłoszono `https://oszczedzify.org/sitemap.xml`. Search Console pokazał „Mapa witryny została przesłana pomyślnie”, następnie stan **Sukces**, ostatni odczyt 22.10.2026 i **7 wykrytych stron**.

- `/`: według bieżącej inspekcji indeksu adres znajduje się w Google. Test wersji opublikowanej: „Google ma dostęp do adresu URL” i „Stronę można zindeksować”.
- `/calculators/treasury-bonds`, `/calculators/regular-contribution`, `/calculators/long-term-savings`: według inspekcji indeksu adresy były Google nieznane. Osobny test wersji opublikowanej dla każdego z trzech kalkulatorów potwierdził dostęp Google i możliwość indeksowania.

Zgłoszenie sitemapy i pomyślny test dostępności nie oznaczają natychmiastowej indeksacji ani poprawy pozycji. Zapis dotyczy stanu odczytanego w momencie kontroli.

## www — DNS i przekierowanie działają

Dodano custom domain `www.oszczedzify.org` do tego samego site z `redirectTarget: oszczedzify.org`. Operacja: `018b4afa-d738-4da5-88c3-2953b2230b85`. Po utworzeniu domena oczekiwała na weryfikację własności i zmianę DNS.

W Squarespace zastąpiono rekord A dla `www` (`199.36.158.100`) rekordem:

| Typ | Nazwa | Wartość |
| --- | --- | --- |
| CNAME | www | personal-finance-2ee61.web.app |

Rekord A głównej domeny pozostawiono bez zmian. Autorytatywne serwery to `ns-cloud-e1`–`ns-cloud-e4.googledomains.com`. Cloud DNS API jest wyłączone w projekcie Firebase; nie włączano go ani nie zakładano, że strefa domeny znajduje się w tym projekcie. Po dodatkowym potwierdzeniu sesji Google przez użytkownika zmieniono istniejący rekord `www` w Squarespace z A na CNAME `personal-finance-2ee61.web.app`, z zachowaniem TTL 4 godziny. Zapis potwierdzono w panelu oraz odpowiedzią autorytatywnego serwera `ns-cloud-e1.googledomains.com`. Rekord A głównej domeny oraz rekordy TXT pozostały bez zmian.

Końcowy odczyt API: `HOST_ACTIVE`, `OWNERSHIP_ACTIVE`, `redirectTarget: oszczedzify.org`. Pole stanu certyfikatu nadal pokazywało `CERT_PROPAGATING`, ale rzeczywiste połączenia HTTPS przechodziły standardową walidację TLS.

Sprawdzono wszystkie siedem stron przez `https://www.oszczedzify.org`: każda zwraca 301 do odpowiadającego adresu bez `www`, a cel odpowiada 200. Osobno sprawdzono zachowanie ścieżki i query string oraz wejście na `www` w przeglądarce — kończy się na prawidłowej stronie głównej bez `www`. Po aktywacji własności wcześniejszy testowy adres z odpowiedzią 404 mógł pozostawać w cache CDN; nowe żądania i wszystkie właściwe adresy stron przeszły kontrolę.

Etap 3 został wdrożony i przeszedł kontrolę odbiorczą. Nie ma otwartych czynności po stronie użytkownika dla DNS.
