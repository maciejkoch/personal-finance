# Etap 6 — Angular 20 → 21

Stan: 22.10.2026. Migrację wykonano i sprawdzono lokalnie jako krok pośredni do najnowszego Angulara, zgodnie z doprecyzowaniem użytkownika. Bez osobnego commita, pusha i wdrożenia.

## Zmiany i kontrola

- Oficjalne `ng update` podniosło Angular do 21.2.25, CLI/build/SSR do 21.2.27, NgRx do 21.1.1 i Angular ESLint do 21.4.0. TypeScript 5.9.3 i Node 22.23.2 pozostały zgodne.
- Migracje ustawiły bibliotekę TypeScript `es2022`, usunęły zbędne importy CommonModule i jawnie zachowały dotychczasową detekcję zmian. Zoneless jest realizowany w następnym kroku.
- Kompilator wykrył `@defer (when result)`, które sprawdzało istnienie funkcji sygnału. Poprawiono je na `when result()`.
- Przejściowo zastosowano Jest 30.5.2 i preset 17.0.3, z obsługą eksportów Angular 21 przez `moduleResolution: bundler`. Wszystkie 23 dotychczasowe testy w dziewięciu zestawach przeszły. W etapie 7 runner zostaje zastąpiony Vitest.
- Usunięto błędne globalne ustawienie parsera Angular w `.prettierrc`; parser Angular nadal obowiązuje dla HTML. Pozwala to oficjalnym migracjom poprawnie formatować TypeScript i JSON.
- Lint, osobna kompilacja testów TypeScript i `npm ls --all` przeszły. Build produkcyjny wygenerował osiem statycznych tras. Początkowe bundle: 444,60 kB, poniżej progu ostrzegania 500 kB.
- Smoke lokalnego Hostingu potwierdził siedem publicznych stron 200, przekierowania 301, rzeczywiste 404, robots, sitemap, metadane i JSON-LD.

Backend, kontrakty API i obliczenia pozostały bez zmian. Kontynuacja: [etap 7](ETAP-7-RAPORT.md), Angular 22, zoneless, Vitest i Signal Forms.
