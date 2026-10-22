# Etap 4 — publikacja i kontrola produkcji

Data: 22.10.2026. Na polecenie użytkownika wykonano commit, push na `main` i wdrożenie wyłącznie Firebase Hosting projektu `personal-finance-2ee61`.

## Opublikowana wersja

- Źródła: `d7d8e905e72379c503b9afac6f1a5cb828c8b2fc`, czysty katalog roboczy podczas buildu.
- Build: `d7d8e90-2026-10-22T10:49:16.089Z`, API production, oferta `2026-10-v1`, obliczenia v2.
- Hosting version: `aedba44b7203bf49`.
- Release: `1792666201538000`, 22.10.2026, 12:50:01 czasu Europe/Warsaw.
- Narzędzie publikacji: Firebase CLI 15.34.1, `deploy --only hosting`.
- `version.json` pobrany z produkcji jest identyczny z plikiem z lokalnego artefaktu.

Testy przed publikacją: 23 testy frontendu w dziewięciu zestawach, 36 testów backendu, lint obu części, poprawne drzewo zależności i build produkcyjny z ośmioma prerenderowanymi trasami. Gotowy artefakt przeszedł smoke na emulatorze Hostingu. Opublikowano ten sam artefakt, bez kolejnego buildu między kontrolą a deployem.

Functions nie były wdrażane. Zmiana dopuszczająca port 4300 jest aktywna wyłącznie w emulatorze; nie zmienia produkcyjnego CORS ani obliczeń.

## Kontrola produkcji

- `npm run smoke:hosting` — siedem stron z HTTP 200, pojedynczym H1, właściwymi title/description, canonical, Open Graph i JSON-LD w początkowym HTML. Przekierowania 301, rzeczywiste 404, robots i sitemap poprawne. Prawidłowe strony mają `index, follow`.
- Wszystkie 42 pliki JS, CSS, obrazów i ikon zwracają HTTP 200, a ich zawartość jest identyczna z lokalnym artefaktem.
- `npm run smoke:api -- --production --contracts` — cztery endpointy działają; walidacja, odpowiedzi błędów i CORS przeszły kontrolę.
- `www.oszczedzify.org` — prawidłowy TLS i 301 dla wszystkich siedmiu stron, z zachowaniem ścieżki oraz query string.
- Przeglądarka — strona główna, nawigacja do obligacji, formularz, wyniki, tabela i wykres działają. Canonical wskazuje domenę produkcyjną, robots ma `index, follow`, a konsola nie zawiera błędów.

Zachowano znane zachowanie dokumentu technicznego `/404`: w produkcji może mieć HTTP 200 przy `cleanUrls`, lecz ma `noindex`, nie ma canonicala i nie należy do sitemapy. Dowolne nieistniejące strony zwracają HTTP 404.

## Poprzednie wydanie

Poprzednia wersja Hostingu: `20aa0338c455f50e`, release `1792650770329000`, build `706fc76-2026-10-22T06:31:27.914Z`. Pozostaje w historii Hostingu do ewentualnego przywrócenia. Nie wykonywano rollbacku ani zmian DNS.

Szczegóły zapisano w [pliku bazowym](baseline/2026-10-22-stage4-deploy.json). Etap 4 zakończono.
