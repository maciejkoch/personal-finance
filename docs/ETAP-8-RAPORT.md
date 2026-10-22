# Etap 8 — Tailwind 4 i daisyUI 5

Stan: 22.10.2026. Migrację zaimplementowano i sprawdzono lokalnie na bazie `ac41bd38` (Angular 22, Signal Forms, zoneless). Użytkownik autoryzował commit, push i wdrożenie Hostingu. Wynik publikacji oraz kontrola produkcji zostaną zapisane w osobnym raporcie wdrożenia.

## Wersje

| Pakiet | Przed | Po |
| --- | --- | --- |
| Tailwind CSS | 3.4.15 | 4.3.3 |
| daisyUI | 4.12.14 | 5.7.50 |
| Tailwind Typography | 0.5.15 | 0.5.20 |
| PostCSS | 8.x | 8.5.31 |
| Plugin PostCSS Tailwinda | — | 4.3.3 |

Wersje stabilne sprawdzono w npm 22.10.2026. Wykorzystano oficjalne przewodniki [Tailwind](https://tailwindcss.com/docs/upgrade-guide), [daisyUI](https://daisyui.com/docs/upgrade/) i [konfigurację Angulara](https://angular.dev/guide/tailwind).

## Zmiany

- Głównym wejściem jest `src/styles.css`; `.postcssrc.json` używa `@tailwindcss/postcss`. Usunięto stare konfiguracje JS, preset, dyrektywy v3 i bezpośrednią zależność od autoprefixera. Pusty `styles.scss` i `ui.scss` zastąpiły pliki CSS. Sass pozostaje wyłącznie zależnością narzędzi Angulara, nie elementem pipeline stylów aplikacji.
- Konfiguracja CSS-first zawiera plugin Typography, daisyUI, jawne źródło `src/app` bez plików testowych i motyw `pf`. Przeniesiono wszystkie dotychczasowe kolory OKLCH, promienie i rozmiary. Wyłączono dekoracyjne tekstury i głębię; nieaktywne obrazy szumu usunięto także z przycisków i alertów, aby umożliwić automatyczny pomiar kontrastu.
- Usunięte klasy `form-control`, `label-text`, `label-text-alt` i `input-bordered` zastąpiono aktualnymi komponentami oraz utilities. Pola zachowują pełną szerokość, wysokość 48 px i tekst 16 px. Karty strony głównej używają `card-lg`, aby zachować wcześniejsze odstępy.
- Przeniesiono zmienione nazwy utilities: `grow`, `shrink-0`, `backdrop-blur-sm`, `rounded-sm`. Jawnie przywrócono desktopowe menu oraz pionowy układ stopki. `min-w-0` w kontenerze kalkulatorów zapobiega poszerzaniu całej strony przez tabelę; przewijanie pozostaje wewnątrz regionu tabeli.
- Akordeony formularza obligacji używają natywnych `details/summary`, zamiast nienazwanych ukrytych checkboxów. Działają klawiszem Enter. Menu i zwijany opis udostępniają stan `aria-expanded`; `inert` usuwa ukryte kontrolki z kolejności Tab. `aria-current` w nawigacji wskazuje aktualną trasę.
- Rozjaśniono trzy najciemniejsze odcienie czerwieni w opcjonalnym wyróżnianiu wyników obligacji. Cała paleta wyników osiąga co najmniej 5,645:1 względem tła `#111827`. Klasyfikacja wartości i obliczenia pozostały bez zmian.

Nie zmieniono kontraktów HTTP, danych oferty, kluczy localStorage ani backendu. Chart.js pozostaje w dotychczasowej wersji do etapu 9c.

## Weryfikacja techniczna

| Sprawdzenie | Wynik |
| --- | --- |
| `npm ci --offline --no-audit --no-fund` | Czysta instalacja: 475 pakietów na lokalnej platformie |
| `npm ls --all` | Bez błędów zależności i konfliktów peer dependencies; opcjonalne binaria innych platform nie są instalowane |
| `npm test` | 28 testów w 10 zestawach, w tym regresje formularzy i ładowania obligacji |
| `npm run lint` i kontrola typów testów | OK |
| Produkcyjny `npm run build` | 8 prerenderowanych tras i finalizacja 404 |
| `smoke:hosting` na lokalnym porcie 5050 | Siedem stron, metadane, canonicale, JSON-LD, 301, prawdziwe 404, robots i sitemap: OK |
| Zasoby Hostingu | 35 plików JS/CSS/obrazów/ikon: HTTP 200 i zgodność bajtów z artefaktem |
| Treść prerenderu | Tekst wszystkich ośmiu dokumentów zgodny z bazą sprzed migracji; pominięto style i skrypty |
| Artefakt | Nie zawiera tymczasowego narzędzia QA ani biblioteki axe |
| `git diff --check` | OK |

Testy Angulara i build wykonano poza ograniczonym sandboxem. Pozostaje wcześniejsze ostrzeżenie CommonJS Lodash. Czysta instalacja zgłasza też deprecjację `@angular/animations` oraz blokadę skryptów instalacyjnych przez lokalną politykę npm; kompilator i testy działają bez ich odblokowywania.

CSS ma 104,56 kB, wobec 77,75 kB przed migracją. Początkowy zestaw zasobów ma 455,43 kB i pozostaje poniżej istniejącego budżetu 500 kB. Zmiana obejmuje kod nowych wersji Tailwinda i daisyUI; usunięto skanowanie plików testowych.

## Przeglądarka i dostępność

- Porównano zapisane widoki bazowe i nowe: kalkulator celu na desktopie i przy szerokości 390 px, stronę główną, obligacje oraz artykuł. Zachowano ciemny motyw, typografię, kolory, układ i podstawowe rozmiary. Niewielkie różnice wynikają ze zmienionych komponentów daisyUI, m.in. przełączników.
- Widok mobilny testowano w ramce tego samego originu o szerokości 390 px w Chromium. Kalkulator celu ma szerokość dokumentu 390 px, pola 48 px / 16 px i prawidłowo skalowany wykres. Po poprawce desktopowy dokument obligacji mieści się w 1265 px obszaru treści okna 1280 px; tabela wyników przewija się osobno.
- Sprawdzono Enter/Space na menu i akordeonach, przejście do obligacji z menu mobilnego, Tab po zwinięciu opisu oraz fokus i przewijanie regionu tabeli. Ukryty przycisk „Rozpocznij” jest pomijany po zwinięciu opisu.
- Cel 10 000 zł / 2 lata / inflacja 3% / stopa 5% daje 425,03 zł miesięcznie. Pominięcie obu stóp daje 416,67 zł i wyłącza odpowiednie pola. Przywrócenie przełączników odtwarza wynik.
- Regularne wpłaty 500 zł / 2 lata / 5% nadal dają 12 480,30 zł po podatku. Obligacje 10 sztuk / 2 lata dają maksymalnie 1072,41 zł dla ROD. Wyniki i wykresy aktualizują się po zmianach.
- Puste pole celu oraz okres obligacji 1,5 roku wyświetlają komunikaty walidacji. Rozwinięte założenia dodatkowe, wyłączone pola i opcjonalne wyróżnienia pozostają dostępne.
- Przez tymczasowy lokalny serwer testowy wymuszono opóźnienie API o 4 sekundy: widoczny jest status aktualizacji oraz animowane skeletony. Odpowiedź 503 wyświetla alert; przy błędzie aktualizacji wcześniejszy wynik pozostaje widoczny. Po przywróceniu odpowiedzi poprawnych kalkulator ponownie działa. Serwer testowy zatrzymano i przywrócono oryginalny plik środowiska lokalnego.

Wykonano axe-core 4.14.0 dla tagów WCAG 2 A/AA i 2.1 A/AA: siedem publicznych stron przy szerokości 1280 i 390 px oraz dodatkowe stany formularzy, menu i błędu API. Końcowe 19 próbek nie zawiera naruszeń. Wyniki: [JSON audytu](baseline/2026-10-22-stage8-a11y.json).

W tabelach obligacji axe pozostawia część ocen kontrastu jako `incomplete`, ponieważ kolumny są przycięte przez przewijanie lub kolumnę przypiętą. Nie oznacza to stwierdzonego naruszenia; sprawdzono czytelność i paletę niezależnie. Audyt nie obejmuje tekstu rysowanego w canvas wykresów, czytnika ekranu ani rzeczywistego Safari/Firefox. Wynik nie stanowi pełnego potwierdzenia zgodności całego serwisu z WCAG.

## Dalszy krok

Użytkownik zatwierdził etap i polecił commit, push oraz wdrożenie Hostingu. Kolejny zakres planu to 9a — SDK i zależności Functions; Chart.js i pozostałe biblioteki frontendu należą do 9c.
