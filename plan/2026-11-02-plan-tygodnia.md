# Plan na tydzień: działający i szybki blog (2–8.11.2026)

Źródła: kod (`master` @ `39d0348`), projekt Linear „Spóźnione Podróże” (P-LAN-2), dokument
„Plan v2 — stan na 2026-10-26”, dane w Sanity (`uk2139y1/production`).

**Cel na niedzielę 8.11:** `https://spoznionepodroze.pl` serwuje blog z Cloudflare Workers.
Ma prawdziwe posty, porządną stronę posta, podstawowe SEO, wynik Lighthouse mobile ≥ 90,
a publikacja w Sanity automatycznie odpala rebuild.

**Poza zakresem tego tygodnia:** komentarze, plugin AI, wyszukiwarka, chatbot, MCP, audio, mapa miejsc,
pełny redesign (to tydzień 2, sekcja 8).

**O czym jest blog:** autor ma 42 lata i dopiero teraz ma przestrzeń oraz determinację, żeby spełniać
marzenie o podróżowaniu i własnym blogu. „Spóźnione” odnosi się do realizacji marzenia na tym etapie życia.
Na blogu będą zarówno nowe wyjazdy, jak i podróże odbyte w ostatnich około 10 latach; autor podróżował
już wcześniej. Odstęp między podróżą a publikacją nie definiuje marki. Obecne teksty strony („pisany
z dystansu”) wymagają korekty w LAN-162. Wiek należy do historii autora, nie do stałego hasła marki.

---

## 1. Gdzie jesteśmy

### Działa w kodzie

- Astro 7 SSG z React islands, Tailwind 4, Biome, Node 24.
- Strona główna z mapą MapLibre, pigułkami kontynentów i wyróżnionymi historiami.
- Lista „Najnowsze”, strona posta `/{kraj}/{slug}`, 404, motyw jasny/ciemny, PL na `/` i EN pod `/en/`.
- Sitemap, `llms.txt`.
- `wrangler.jsonc`, skrypt `preview:cf` i sprawdzony lokalny podgląd (LAN-148 zamknięte).
- Wdrożenie na `spoznione-podroze.staszek-zajaczkowski.workers.dev`; sprawdzone HTTP 200 dla PL/EN,
  przykładowych postów i sitemapy oraz 404 dla nieistniejącej strony (1.11).
- Studio wdrażane osobno (`spoznione-podroze.sanity.studio`), schemat `continent → country → post`.

### Brakuje

- **Deploy:** brakuje CI, własnej domeny i webhooka z Sanity. Workers Builds dla `master` już działa;
  według najnowszego komentarza LAN-151 pozostaje włączenie i sprawdzenie podglądów PR.
- **Treść:** w Sanity jest 10 postów demo (5 PL i 5 EN) z jednym akapitem każdy, bez galerii.
  To jest największe ryzyko, bo bez prawdziwych postów blog nie nadaje się do pokazania.
- **Strona posta:** Portable Text bez stylów, brak daty, galerii, linku do kraju i powiązanych postów.
  Przełącznik PL/EN na stronie posta nie zna tłumaczenia (brak `altHref`), więc odsyła na stronę główną.
- **SEO:** brak canonical, `og:image`, hreflang, JSON-LD, RSS i `robots.txt`.
- **Szkielety „w budowie”:** Kontynenty, O mnie, Współpraca (PL i EN).

### Co spowalnia stronę (zmierzone na `dist/`)

1. **`HeroMap` waży ok. 1 MB JS** (MapLibre) i ładuje się od razu na stronie głównej (`client:only`).
2. **Klient Sanity trafia do przeglądarki.** `src/sanity/lib/image.ts` importuje `sanityClient`, a
   `SanityImage.tsx` jest używany w islandach (`FeaturedStories`). W bundlu widać `ui.js` (136 KB) i
   `stegaEncodeSourceMap`. Builder obrazów nie potrzebuje klienta, wystarczy `projectId` i `dataset`.
3. **Obrazy:** jeden URL bez `srcset`/`sizes`; LQIP jest pobierane, ale nieużywane.
   `auto("format")` już działa w `src/sanity/lib/image.ts` — zachować je przy zmianie buildera.
4. Trzy islandy React z `client:load` (`ContinentPills`, `FeaturedStories`, `MobileMenu`).

---

## 2. Co usunąć albo uporządkować (pon. rano, ok. 1 h, agent)

| #   | Co                                                                             | Dlaczego                                                                                 |
| --- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| 1   | `src/assets/blog-placeholder-*.jpg` (6 plików)                                 | resztki szablonu Astro, nigdzie nieużywane                                               |
| 2   | `README.md`                                                                    | to README szablonu „Astro Starter Kit: Blog”, trzeba je zastąpić krótkim opisem projektu |
| 3   | `extensions.json`, `launch.json` w roocie                                      | ustawienia VS Code leżą w złym miejscu; przenieść do `.vscode/` albo usunąć              |
| 4   | zależność `class-variance-authority`                                           | nieużywana (wróci razem z komponentami shadcn)                                           |
| 5   | wzmianka o MCP w stopce (`footer.ai` w `src/i18n/ui.ts`) i w `public/llms.txt` | reklamuje endpoint, który nie istnieje (LAN-109 jest odłożone)                           |
| 6   | zdanie „Studio is embedded at `/studio`” w `AGENTS.md`                         | nieaktualne, bo Studio jest wdrażane osobno; poprawić w ramach LAN-156                   |
| 7   | `package.json`: `"name": "bustling-belt"`, `engines.node >=22.12`              | nazwa z generatora; wymaganie Node niezgodne z `.nvmrc` (24) i z `AGENTS.md`             |
| 8   | `.gitignore`                                                                   | duplikaty (`node_modules`, `.DS_Store`) i zbędny `.vercel`                               |
| 9   | 10 postów demo w Sanity                                                        | przed startem zastąpić prawdziwymi albo cofnąć publikację (sobota)                       |
| 10  | strony-szkielety                                                               | na produkcji nie może być „w budowie”: wypełnić treścią albo ukryć w nawigacji (piątek)  |

Zostają, choć mogą wyglądać na zbędne: `sanity`, `styled-components`, `react-is` (Studio wdrażasz z
tego repo, to jego peer dependencies), `components.json` (shadcn jest w planie LAN-99) i `sharp`.

---

## 3. Decyzje do podjęcia przed startem (15 minut)

Proponuję domyślne odpowiedzi, które nie blokują tygodnia:

- **D7 Analityka:** Cloudflare Web Analytics, bo jest darmowa, bez cookies i bez banera. Plausible później, jeśli zajdzie potrzeba.
- **D1 Monetyzacja:** na start bez reklam, czyli bez CMP i bez banera zgód. Wracamy po starcie.
- **D5 Repo:** zostaje publiczne, branch `master`. LAN-95 można zamknąć.
- **D4 / D9 Model treści i dane:** bez zmian w schemacie, zostaje `fetch`. Typegen po starcie.
- **D10 Języki:** tylko PL i EN.
- **Nowa: EN na starcie?** Każdy post wymaga tłumaczenia. Albo tłumaczysz posty (Claude robi pierwszy
  szkic), albo na start ukrywamy przełącznik i `/en/`. **Rekomendacja:** tłumaczyć, bo infrastruktura już jest.

---

## 4. Plan dzień po dniu

Legenda: 👤 robisz sam (panel, konto, treść), 🤖 może zrobić agent, ⭐ krytyczne dla startu.
W Linear wszystko jest w milestonie „Start — 8.11.2026 (blog live)”, a termin każdego issue to dzień z tego planu.

### Niedziela 1.11 (dziś, 15 min)

- [x] 👤⭐ **LAN-93, krok 1–3** Wyłącz **DNSSEC** w OVH. Domena ma go włączonego, a bez wyłączenia zmiana
  serwerów DNS zepsuje domenę. Wyłączenie trwa do 24 h. Instrukcja krok po kroku jest w LAN-93.
  **Zrobione 2.11:** brak rekordu DS w rejestrze `.pl` i w publicznych resolverach.
- [ ] 👤 Zatwierdź decyzje z sekcji 3.
- [x] Cloudflare MCP podłączony do Claude Code (zakres lokalny, scope'y tylko do odczytu plus kilka zapisów DNS/Workers),
  lokalny `origin` zmieniony na `staszekz/spoznione-podroze` (repo przemianowane na GitHubie).

### Poniedziałek 2.11: sprzątanie i szkielet deployu

- [x] 👤⭐ **LAN-93, krok 4–9** Gdy `dig +short DS spoznionepodroze.pl` zwróci pustą odpowiedź: dodaj domenę
  w Cloudflare, zostaw rekordy MX poczty OVH i zmień serwery DNS w OVH na te z Cloudflare.
  **Zrobione 2.11:** strefa `active` od 22:58 (NS `carla`/`garret`); zostały tylko rekordy poczty OVH.
- [x] 👤🤖 **LAN-171** Poczta: `kontakt@spoznionepodroze.pl` → Gmail przez Cloudflare Email Routing
  (MX/SPF/DKIM od Cloudflare, DMARC `p=none`); test dotarł 2.11. Wysyłka z adresu w domenie: później (płatna skrzynka).
- [ ] 🤖 Za kilka dni: DNSSEC w Cloudflare (nowy DS w OVH) i HSTS.
- [ ] 🤖 **LAN-158** Sprzątanie z sekcji 2 (punkty 1–8).
- [x] 🤖 **LAN-148** `pnpm preview:cf` sprawdzone 1.11, issue zamknięte.
- [ ] 🤖⭐ **LAN-149** CI w GitHub Actions: `biome ci`, `astro check` i build na PR.
  Potrzebne są `@astrojs/check` i `typescript` oraz zmienne `PUBLIC_SANITY_*` w CI.
- [ ] 👤⭐ **LAN-151** Domknij Workers Builds: produkcja na `*.workers.dev` już działa; włącz i sprawdź podglądy PR.
- [ ] 🤖 **LAN-156** Zaktualizuj `AGENTS.md` (Studio, komendy, deploy).

### Wtorek 3.11: domena i rebuild z Sanity

- [x] 👤⭐ **LAN-154** Podepnij domenę `spoznionepodroze.pl` pod Workera, ustaw przekierowanie www → apex i HTTPS.
  **Zrobione 2.11 (wcześniej):** custom domains apex + www, Always Use HTTPS, Single Redirect 301 www → apex
  (ścieżka i query zachowane); smoke: 200 / 404 / 301 OK.
  Wymaga statusu „Active” strefy w Cloudflare. Jeśli DNSSEC albo propagacja się przeciągną, zadanie przesuwa się na środę;
  do tego czasu blog działa na `*.workers.dev`.
- [ ] 👤⭐ **LAN-155** Webhook Sanity → deploy hook Workers Builds.
- [ ] 🤖 **LAN-153** Nagłówki: `public/_headers` z nagłówkami bezpieczeństwa i długim cache dla `/_astro/*`, `noindex` na `*.workers.dev`.
- [ ] 🤖 **LAN-150** Skrypt smoke HTTP (krótki, przyda się w niedzielę).

Od wieczora blog działa na produkcji. Od tego dnia każda kolejna zmiana trafia na żywą stronę.

### Środa 4.11: szybkość

- [ ] 🤖⭐ **LAN-100** Wyrzuć klienta Sanity z bundla przeglądarki: `urlFor` na `createImageUrlBuilder({ projectId, dataset })` zamiast `sanityClient`.
- [ ] 🤖⭐ **LAN-100 (bez lightboxa)** `SanityImage`: `srcset` + `sizes`, LQIP jako tło placeholdera;
  zachowaj istniejące `auto("format")`.
- [ ] 🤖⭐ **LAN-159** Leniwa mapa: dynamiczny `import("maplibre-gl")` dopiero, gdy mapa wejdzie w viewport, a do tego czasu statyczny placeholder.
- [ ] 🤖 **LAN-159** Islandy: `client:load` → `client:visible` / `client:idle` tam, gdzie interakcja nie jest potrzebna od razu.
- [ ] 🤖 **LAN-159** Lighthouse mobile przed zmianami i po nich (strona główna i post). Cel: ≥ 90 Performance.
- [ ] 🤖 **LAN-164** Kontrast tekstu do WCAG AA. Dziś nie przechodzą: terakotowe etykiety i linki (4.10:1),
  meta „8 min · 24 zdjęcia” (3.04:1) i stopka (1.95:1). Nowe wartości są w issue.

### Czwartek 5.11: strona posta (LAN-111, minimum)

- [ ] 🤖⭐ **LAN-163** Schemat posta, **przed sobotą**, żeby prawdziwe posty i zdjęcia od razu miały te dane:
  - `tripDate`: kiedy była podróż. Na poście: „Podróż: wrzesień 2017. Opisana: listopad 2026.”;
  - `updatedAt` + `updateNote` (opcjonalne, ustawiane ręcznie przy istotnej zmianie):
    „Zaktualizowano: listopad 2027. Nowe ceny biletów.” Trafia też do `dateModified` w JSON-LD;
  - `location` (opcjonalne): ogólne miejsce historii, np. miasto, wpisywane ręcznie;
  - lokalizacja i EXIF ze zdjęć zapisywane przy wgrywaniu. Sanity robi to tylko w chwili uploadu,
    więc ustawienie musi być wdrożone przed wgraniem prawdziwych zdjęć.
- [ ] 🤖⭐ Okładka posta na pełną szerokość ekranu.
- [ ] 🤖⭐ Style Portable Text: nagłówki, listy, cytaty, linki, obrazy inline z podpisem.
- [ ] 🤖⭐ Meta posta: link do kraju, galeria jako prosta siatka (lightbox później).
- [ ] 🤖 Spis treści z nagłówków H2 (gdy są co najmniej 3) i ramka autora na końcu wpisu.
- [ ] 🤖⭐ Przełącznik PL/EN na poście prowadzi do tłumaczenia (`altHref` z `translation.metadata`).
- [ ] 🤖 „Więcej z {kraj}”: 3 powiązane posty.
- [ ] 🤖 (opcjonalnie) **LAN-103** Licz czas czytania i liczbę zdjęć automatycznie zamiast ręcznych pól `readingTime` / `photoCount`.
- [ ] 🤖 (opcjonalnie) **LAN-107** Sekcja „Co bym dziś zrobił inaczej”: tylko tam, gdzie autor ma coś do dodania.
  To opcjonalna refleksja, nie obowiązkowy element wpisu ani wyjaśnienie nazwy bloga.

### Piątek 6.11: SEO i strony statyczne

- [ ] 🤖⭐ **LAN-114 (minimum)** Canonical, `og:image` z okładki, hreflang PL↔EN, JSON-LD `BlogPosting`, RSS per język (`@astrojs/rss`), `robots.txt`.
- [ ] 🤖⭐ **LAN-162** Nowe teksty marki (strona główna, opis strony, `llms.txt`). 👤 Zaakceptuj brzmienie.
- [ ] 🤖⭐ **LAN-124** O mnie: statyczny tekst w Astro wystarczy (treść z Sanity po starcie).
  👤 Napisz tekst: tu jest miejsce na historię „42 lata, wreszcie ruszam”.
- [ ] 🤖 Współpraca: statyczna strona. Kontynenty: prosta lista z danych, które już pobiera strona główna, albo ukrycie w nawigacji.
- [ ] 🤖 **LAN-125 (krótka wersja)** Polityka prywatności (CF Web Analytics nie używa cookies, więc wystarczy krótki tekst).
- [ ] 👤 **LAN-120 (część)** Włącz Cloudflare Web Analytics, zweryfikuj Search Console i zgłoś sitemap.

### Sobota 7.11: treść ⭐ (najważniejszy dzień, LAN-160)

- [ ] 👤⭐ 3–5 prawdziwych postów PL ze zdjęciami, alt tekstami, excerptem i **datą podróży**.
  Dobrze, żeby był miks: coś z archiwum i coś świeżego, bo to od razu pokazuje, o czym jest blog.
- [ ] 👤⭐ Tłumaczenia EN (pierwszy szkic od Claude, potem poprawka), jeśli zostajemy przy EN na starcie.
- [ ] 👤⭐ Cofnij publikację albo usuń posty demo. Uzupełnij kraje i kontynenty pasujące do prawdziwych postów.

### Niedziela 8.11: start (LAN-161)

- [ ] 🤖 Smoke na produkcji: strony, 404, sitemap, RSS, przekierowania.
- [ ] 🤖 Lighthouse na produkcji, podgląd OG (np. opengraph.xyz).
- [ ] 👤 Sprzątanie Linear: zamknij zrobione, a z częściowo zrobionych issues wydziel resztę zakresu do nowych issues.

---

## 5. Odłożone na po starcie

| Issue                        | Temat                                                             |
| ---------------------------- | ----------------------------------------------------------------- |
| LAN-113                      | wyszukiwarka Pagefind od ok. 15–20 wpisów (sekcja 12)             |
| LAN-98                       | typegen zamiast ręcznych typów                                    |
| LAN-99, LAN-165              | design system i redesign (tydzień 2, sekcja 8)                    |
| LAN-166, LAN-167             | newsletter, FAQ (tydzień 2)                                       |
| LAN-100 (reszta)             | galeria z lightboxem (tydzień 2)                                  |
| LAN-112 (reszta)             | pełne strony kontynentu i kraju z paginacją                       |
| LAN-168                      | cała podróż z uporządkowanymi etapami i ich galeriami (sekcja 10) |
| LAN-169                      | pełnoekranowa strona „Mapa” zamiast „Kontynenty” (sekcja 11)      |
| LAN-170                      | zdjęcia przez Cloudflare Images, gdy transfer Sanity > 30%        |
| LAN-152, LAN-157             | smoke w CI i codzienny cron na produkcji                          |
| LAN-94, LAN-115, LAN-121–123 | plugin AI „Generuj draft”                                         |
| LAN-92, LAN-116–118, LAN-104 | Supabase, komentarze, bookmarki                                   |
| LAN-102, LAN-105, LAN-106    | audio, mapa miejsc, praktyczne info                               |
| LAN-109                      | serwer MCP                                                        |
| LAN-108                      | parking pomysłów                                                  |

## 6. Porządki w Linear (zrobione 1.11)

- Nowy milestone „Start — 8.11.2026 (blog live)”, a w nim issues na ten tydzień z terminami.
- Zamknięte: **LAN-95** (repo publiczne, `master`) i **LAN-148** (sprawdzone przez `wrangler dev`).
- Nowe: **LAN-158** sprzątanie, **LAN-159** wydajność, **LAN-160** treść, **LAN-161** checklista startu.
- **LAN-93** przepisane krok po kroku (DNSSEC, MX, kolejność).
- LAN-100, 111, 114, 120, 124 i 125 dostały komentarz „zakres na start”.
- Opisy milestone'ów Faza 1 i Faza 5 poprawione (Astro 7, Workers zamiast Pages).
- Do zrobienia: potwierdzić decyzje D1–D10 i wpisać je do „Planu v2”.

Dopisane później tego samego dnia:

- Start: **LAN-162** teksty marki, **LAN-163** daty podróży i aktualizacji, **LAN-164** kontrast.
  LAN-111 i LAN-114 dostały w zakresie spis treści, ramkę autora, okładkę na pełną szerokość i `dateModified`.
- Nowy milestone „Tydzień 2 — dziennik podróży (9–15.11.2026)”: **LAN-99** (2 warianty design systemu),
  **LAN-165** redesign, **LAN-166** newsletter, **LAN-167** FAQ.
- Doprecyzowane **LAN-162, LAN-163, LAN-107, LAN-124 i LAN-165**: prawdziwe znaczenie nazwy,
  równorzędne nowe i starsze wyjazdy, opcjonalna refleksja i oś lat jako propozycja.
- **LAN-168**: strona całej podróży, samodzielne wpisy i galerie etapów oraz ręczna kolejność;
  po starcie, bez obowiązku wdrażania mapy w pierwszej wersji. Szczegóły w sekcji 10.

## 7. Hosting: dlaczego zostaje Cloudflare

Rozważane pod kątem bloga ze zdjęciami, komentarzami i być może forum w przyszłości.

- **Astro należy do Cloudflare** (przejęcie ogłoszone 16.01.2026, framework zostaje open source na licencji MIT). Integracja Astro z Workers będzie traktowana priorytetowo.
- **Wszystko, czego blog będzie potrzebował, jest na jednej platformie i w darmowym planie z prawem do użytku komercyjnego:**
  statyczne strony (bez limitu), SSR i API (`@astrojs/cloudflare`), baza D1 (SQLite) na komentarze i forum,
  R2 na zdjęcia (bez opłat za transfer, co dla foto-bloga ma największe znaczenie), Images do skalowania zdjęć,
  Turnstile przeciw spamowi i Durable Objects do realtime.
- **Migracja nie jest potrzebna.** Gdy przyjdą komentarze, dokładasz adapter do tego samego Workera.
- **Alternatywy:**
  - Vercel: Hobby nie pozwala na użytek komercyjny, Pro kosztuje 20 $/mies.
  - Netlify: działa, ale limity transferu i rozliczanie kredytami są gorsze dla zdjęć.
  - Własny VPS (np. Hetzner + Coolify): pełna kontrola za kilka euro miesięcznie, ale serwer utrzymujesz sam.
    Ma sens dopiero dla gotowego forum typu Discourse.
- **Forum w przyszłości** można postawić gdziekolwiek jako `forum.spoznionepodroze.pl`. DNS w Cloudflare tego nie blokuje.
- **Wąskie gardło:** CDN Sanity w planie Free ma limit transferu. Gdy ruch urośnie, zdjęcia można serwować przez Cloudflare Images albo R2.

## 8. Marka i design: z landing page'a w dziennik podróży

### Skąd wrażenie landing page'a

Strona składa się z elementów, które są dziś domyślnym wyglądem stron produktów i stron generowanych przez AI:

- kremowe tło z terakotowym akcentem; ciemny akcent `#d97b4f` jest prawie identyczny z kolorem Claude/Anthropic (`#D97757`);
- etykiety ALL CAPS w monospace nad nagłówkami („BLOG PODRÓŻNICZY · PISANY Z DYSTANSU”);
- meta jako ciągi z kropkami środkowymi („8 min · 24 zdjęcia”), strzałki „→” w przyciskach;
- hero w układzie „hasło + dwa przyciski CTA + mapa”, identyczne zaokrąglone karty, pigułki, gradientowy pas „Poznajmy się”.

Same kolory nie są złe: paleta jest spójna i ciepła. Problem w tym, że cała strona razem wygląda jak szablon.
Do tego część drobnego tekstu nie spełnia WCAG AA (poprawka w LAN-164).

### Kierunek

Osobisty dziennik kogoś, kto po latach odkładania wreszcie podróżuje. Pierwsze wrażenie robią zdjęcia
i historia autora, a nie hasło z przyciskami.

**Propozycja wizualna do sprawdzenia w LAN-99:** rok podróży jako duża typografia i dodatkowa oś czasu.
Daty pomagają odróżnić nowe wyjazdy od starszych; różnica „podróż 2017, opisana 2026” nie jest znaczeniem
nazwy. Strona główna powinna dawać dostęp do nowych publikacji oraz całych podróży, także nowych.
Oś lat jest jednym z wariantów prezentacji, nie jedynym sposobem odkrywania treści.

```
STRONA GŁÓWNA                                POST
[logo | Podróże  Mapa  O mnie | PL/EN ◐]     [okładka na pełną szerokość           ]
[zdjęcie najnowszej historii, pełna szer.]   2017   Fiordy Wschodnie po sezonie
[ tytuł, kraj, rok podróży              ]    Podróż: wrzesień 2017. Opisana: listopad 2026.
[autor: zdjęcie + 2–3 zdania + O mnie   ]    [spis treści]
[oś lat                                 ]    tekst wąski, ~70 znaków w linii
[ 2026 | zdjęcie | tytuł, kraj          ]    [zdjęcie szerokie, poza kolumną      ]
[ 2019 | zdjęcie | tytuł, kraj          ]    opcjonalna refleksja autora
[ 2016 | zdjęcie | tytuł, kraj          ]    [ramka autora] [newsletter] [powiązane]
[statyczny podgląd mapy → /mapa (LAN-169)]
[stopka: współpraca, newsletter         ]
```

Wyrównanie do lewej, bez centrowania sekcji. Usuwamy: przyciski CTA w hero, gradientowy pas, etykiety ALL CAPS,
monospace, kropki środkowe w meta, strzałki w przyciskach, jedno zaokrąglenie na wszystkim.

### Kolory: dwa warianty do wyboru (LAN-99)

**A. Obecna ciepła paleta po poprawce kontrastu.** Najmniej pracy, ale charakter szablonu zostaje
w kolorach i trzeba go zabić układem.

**B. Atrament i mapa (rekomendacja).** Neutralny, lekko chłodny papier, żeby kolor dawały zdjęcia.
Wszystkie pary sprawdzone pod kątem kontrastu (≥ 5.3:1):

| Rola                                     | Jasny     | Ciemny    |
| ---------------------------------------- | --------- | --------- |
| tło (papier)                             | `#F4F5F2` | `#10151A` |
| tekst (atrament)                         | `#1C2630` | `#E6E9E5` |
| linki i interakcje (fiord)               | `#245A7A` | `#86B4D4` |
| rok podróży, znacznik archiwum (stempel) | `#A3352B` | `#E08A7E` |
| meta (kamień)                            | `#5C6670` | `#9AA3AB` |

### Typografia

- Nagłówki: **Bricolage Grotesque** zostaje. Ma oś szerokości, więc duże liczby lat mogą być szerokie i rozpoznawalne.
- Tekst wpisów: **Literata** (krój książkowy do długiego czytania, pełne polskie znaki) w wariancie B,
  Hanken Grotesk w wariancie A.
- **DM Mono** znika.

### Kolejność

1. **Tydzień startowy:** tylko rzeczy tanie i pilne: teksty marki (LAN-162), daty (LAN-163), kontrast (LAN-164),
   okładka na pełną szerokość, spis treści i ramka autora (LAN-111).
2. **Tydzień 2:**
   - `/styleguide` z wariantami A i B, wybierasz (LAN-99);
   - redesign strony głównej i posta (LAN-165);
   - newsletter (LAN-166), lightbox (LAN-100), FAQ (LAN-167).
     Sprawdzenie na 375 px: mój zrzut mobilny z przeglądarki headless był ucięty z prawej, ale to może być
     ograniczenie tej przeglądarki. Weryfikacja jest w kryteriach LAN-165.

## 9. Inspiracje z zagranicznych blogów (przegląd 1.11.2026)

Obecny design jest współczesny. Dalsze prace mają nadać mu osobisty charakter i poprawić czytanie;
zmiana palety czy kroju pisma pozostaje propozycją do porównania na prawdziwych zdjęciach i tekstach.

| Inspiracja                                                                                                     | Co wykorzystać                                                                                            | Powiązanie z planem       |
| -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------- |
| [Along Dusty Roads](https://www.alongdustyroads.com/)                                                          | Fotografie, osobiste historie i osobne wejścia do miejsc, tras oraz opowieści.                            | LAN-99, LAN-165, LAN-168  |
| [Earth Trekkers](https://www.earthtrekkers.com/10-day-iceland-ring-road-itinerary/)                            | Strona całej trasy z etapami, spis treści, konkretne informacje praktyczne.                               | LAN-111, LAN-106, LAN-168 |
| [Nomadic Matt](https://www.nomadicmatt.com/)                                                                   | Jasne przejście do treści i przedstawienie autora; wyszukiwarka oraz newsletter wraz z rozwojem katalogu. | LAN-124, LAN-113, LAN-166 |
| [The World Travel Guy](https://theworldtravelguy.com/) i [The Blonde Abroad](https://www.theblondeabroad.com/) | Własne zdjęcia, widoczny autor i grupowanie treści według miejsc lub rodzaju wyjazdu.                     | LAN-100, LAN-112, LAN-124 |

Priorytety wynikające z porównania:

- **Przed startem:** dopracować jeden prawdziwy artykuł i jego zdjęcia (LAN-111, LAN-100, LAN-160),
  wyjaśnić historię autora (LAN-124, LAN-162), pokazywać datę podróży i istotnej aktualizacji (LAN-163).
- **Przy zmianie homepage:** na telefonie pierwsza historia ze zdjęciem powinna poprzedzać dużą mapę
  (LAN-165). Zapewnić czytelne listy miejsc jako alternatywę dla mapy (LAN-112).
- **Dalsze czytanie:** powiązane wpisy w LAN-111, a ręczna kolejność rozdziałów jednej podróży w LAN-168.
- **Po starcie:** informacje praktyczne (LAN-106) i formularz newslettera (LAN-166). Spis treści jest
  potrzebny w długich wpisach; krótka galeria nie wymaga sztucznego rozbudowywania tekstu.

## 10. Jedna podróż, wiele historii i galerii (LAN-168)

**Kierunek:** podróż ma własną stronę zbiorczą, a przystanki są samodzielnymi wpisami. Strona podróży
opowiada o całym wyjeździe: wprowadzenie, przebieg, kolejność miejsc i podsumowanie. Każdy etap ma
własny adres, krótki lub długi tekst oraz galerię. Etap może też być przede wszystkim fotorelacją.
Nie kopiujemy całych wpisów do jednego ogromnego artykułu.

Przykład autora: wyjazd samochodem z Chapel Hill, NC nad Niagarę, obejmujący również Pittsburgh,
stolicę Pensylwanii i prawdopodobnie Waszyngton, DC. Pełna lista i kolejność przystanków wymagają
potwierdzenia autora; poniższa struktura nie ustala przebiegu trasy:

```text
Cała podróż: samochodem z Chapel Hill nad Niagarę
  ├─ Pittsburgh — osobny wpis i galeria
  ├─ Niagara — osobny wpis i galeria
  ├─ Stolica Pensylwanii — osobny wpis i galeria
  └─ Pozostałe przystanki, np. Waszyngton, DC — do potwierdzenia
```

Zachowanie dla czytelnika:

- Strona podróży pokazuje opublikowane etapy w kolejności wybranej przez autora, z okładką i zajawką.
- Każdy etap linkuje do całej podróży oraz poprzedniego i następnego opublikowanego etapu.
- Można wejść z wyszukiwarki bezpośrednio na wpis o mieście i łatwo znaleźć pozostałą część wyjazdu.
- Podróż może rosnąć wraz z publikacją kolejnych etapów; brakujące tłumaczenia i drafty nie tworzą
  niedziałających linków. Zwykłe wpisy bez przypisania do podróży nadal działają.
- Galeria należy do etapu. Strona całej podróży pokazuje wybrane zdjęcia i odsyła do galerii etapów.
- Rok podróży i kraj służą filtrowaniu; podróż może obejmować kilka krajów. Istniejące adresy wpisów
  pozostają bez zmian.

Propozycja techniczna do przyszłej implementacji: dokument `trip` i uporządkowane referencje do postów.
Kolejność musi mieć jedno źródło prawdy i być edytowalna niezależnie od dat. Samo `tripDate` nie wystarczy:
kilka etapów może przypadać jednego dnia albo mieć znany tylko miesiąc. Nie utrzymywać równolegle
dwóch niezależnych list przynależności i kolejności.

**Zakres pierwszej wersji:** strona podróży, przypisanie i kolejność etapów, galerie etapów oraz linki
„cała podróż / poprzedni / następny”. Mapa rzeczywistego przejazdu i zbiorcza galeria z lightboxem
mogą dojść później. Nie obiecywać trasy drogowej na podstawie prostych linii między punktami.
LAN-168 pozostaje po starcie, bez dokładania blokady do terminu 8.11; istniejące wpisy będzie można
połączyć w podróż później.

## 11. Mapa: osobna strona na cały ekran (LAN-169) i licencja mapy bazowej

**Kierunek:** interaktywna mapa przechodzi ze strony głównej na własną stronę `/mapa` (EN `/en/map`),
która zastępuje szkielet „Kontynenty”. Strona główna zaczyna się od zdjęć i historii, a mapę zapowiada
statycznym podglądem z linkiem. MapLibre (ok. 1 MB) ładuje się tylko na stronie mapy.

- Pinezka to wpis; na start lokalizacja z kraju. Klik otwiera kartę ze zdjęciem, tytułem, krajem i rokiem podróży.
- Filtr kontynentów (obecne pigułki) i lista wpisów widocznych na mapie jako alternatywa dostępna z klawiatury.
- Później, gdy będzie treść: podświetlenie odwiedzonych krajów (także bez wpisów), filtr lat,
  wyróżnienie etapów jednej podróży z LAN-168, bez udawania trasy prostymi liniami.
- **Przybliżanie:** z daleka jedna pinezka na całą podróż (plus pojedyncze wpisy, gęste miejsca w klastrach).
  Po przybliżeniu podróż rozpada się na etapy w konkretnych miejscach, ponumerowane w kolejności autora.
  Klik w podróż dopasowuje widok do wszystkich etapów. Konkretne miejsca wymagają lokalizacji na poście
  (dziś ma ją tylko kraj); decyzja, kiedy dodać to pole, należy do autora.

**Licencja:** obecne style CARTO (`basemaps.cartocdn.com`) wymagają licencji Enterprise przy użytku komercyjnym.
W środę, przy LAN-159, podmiana na OpenFreeMap (`positron` / `dark`). Regulamin sprawdzony 1.11:
użytek komercyjny dozwolony, bez kluczy, limitów i cookies, atrybucja dodawana automatycznie przez MapLibre,
ale bez SLA. Przykłady działających stron: bboxfinder.com, blahaj.quest.
Później do rozważenia własne kafelki Protomaps (PMTiles) na Cloudflare R2 z własnym stylem.

## 12. Wyszukiwarka (LAN-113)

U Nomadic Matta to zwykła wyszukiwarka WordPressa (`?s=` na serwer) z linkami „Popular Searches” wpisanymi
na sztywno, bez podpowiedzi. U nas, bez serwera, **Pagefind**:

- indeks budowany po `astro build` (`pagefind --site dist`), serwowany jako zwykłe pliki z Cloudflare;
- indeksujemy tylko `<article>` wpisów; kraj i kontynent jako filtry, okładka i rok podróży jako dane do wyników;
- osobny indeks PL i EN automatycznie po `<html lang>`; polski ma w Pagefind stemming, więc rozumie odmianę;
- lupa w nagłówku otwiera okno, wyniki w trakcie pisania (miniatura, tytuł, kraj, rok, fragment z podświetleniem),
  „Popularne” liczone z danych, strona `/szukaj?q=`, pole wyszukiwania na 404;
- skrypt ładowany dopiero po otwarciu wyszukiwarki, więc zero kosztu dla szybkości.

Kiedy: od ok. 15–20 wpisów; przy kilku wpisach rolę „znajdź kierunek” pełni mapa. Praca: ok. pół dnia.

## 13. CMS: zostaje Sanity, EmDash do oceny później

Cloudflare ma własny CMS, **EmDash** (ogłoszony 1.04.2026, dziś wersja 1.4.0, integracja Astro, dane w D1 i R2).
Na start zostajemy przy Sanity: działa schemat, zapytania, Studio i tłumaczenia PL/EN, a obsługa zdjęć jest dojrzała.
Przepisanie zjadłoby tydzień startowy bez zysku dla czytelnika.

Wrócić do tematu, gdy: (1) komentarze albo forum i tak wymuszą tryb serwerowy na Cloudflare,
(2) limity darmowego Sanity zaczną przeszkadzać, (3) EmDash potwierdzi obsługę wielu języków
(w README jej nie znalazłem). Bez issue w Linear, decyzja autora.

## 14. Zdjęcia: Sanity teraz, Cloudflare przed Sanity później (LAN-170)

**Limity (sprawdzone 1.11):**

|                  | Sanity Free                                                       | Cloudflare Free                                      |
| ---------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| Transfer         | 100 GB/mies., bez możliwości przekroczenia (mail przy 80% i 100%) | bez limitu dla statycznych plików i R2               |
| Przechowywanie   | 100 GB zasobów                                                    | R2: 10 GB za darmo, potem ok. 0,015 $/GB miesięcznie |
| Przeskalowywanie | wbudowane                                                         | Cloudflare Images: 5000 unikalnych przeróbek/mies.   |
| Zużycie 1.11     | 30 KB, 0 zdjęć                                                    | nie dotyczy                                          |

Przy ok. 3 MB zdjęć na wyświetlenie wpisu 100 GB w Sanity to ok. 30 tys. wyświetleń miesięcznie.

**Warianty:**

1. **Teraz:** zdjęcia z Sanity CDN, bez zmian.
2. **Gdy transfer w Sanity przekroczy 30% (LAN-170):** Cloudflare Images przed Sanity. Zdjęcia dalej wgrywane
   i kadrowane w Sanity, ale serwowane z `spoznionepodroze.pl/cdn-cgi/image/…`. Cloudflare przerabia
   i zapamiętuje, więc Sanity płaci transferem tylko za pierwsze pobranie danego rozmiaru. Zmiana w jednym helperze.
3. **Oryginały na R2:** dopiero przy odejściu od Sanity; tracimy integrację ze Studio (wgrywanie, kadrowanie, EXIF).

Odrzucone: generowanie wszystkich rozmiarów przy buildzie Astro. Transfer byłby nielimitowany, ale darmowy plan
Workers pozwala na 20 tys. plików na wersję strony, a build (limit 20 min) przerabiałby wszystkie zdjęcia za każdym razem.

**Jak liczy się limit 5000 przeróbek:** przeróbka to jedno zdjęcie w jednym rozmiarze (format AVIF/WebP i jakość
się nie liczą). W danym miesiącu kalendarzowym każda przeróbka liczy się raz, bez względu na to, ile osób
i ile razy ją obejrzy. Licznik zeruje się co miesiąc: to samo zdjęcie 800 px oglądane w listopadzie, grudniu
i styczniu to po jednej przeróbce w limicie każdego z tych miesięcy. Przeróbki nie trafiają do plików strony,
tylko do pamięci podręcznej Cloudflare. Dokumentacja nie rozstrzyga, czy podanie z cache w kolejnym miesiącu
zalicza się do limitu, więc liczymy wariant ostrożny. Po przekroczeniu w planie Free nowe przeróbki zwracają błąd,
a zapamiętane działają; na planie płatnym 0,50 $ za każde kolejne 1000. Żeby mieć zapas: 3–4 wspólne rozmiary
w `srcset` i zmniejszony obraz z Sanity jako źródło zamiast oryginału z aparatu.
