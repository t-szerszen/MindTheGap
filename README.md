# Mind the Gap

Mój zeszyt do angielskiego przed maturą rozszerzoną. Czasy rozpisane z osią czasu i kolorowymi wzorami, tłumacz, z którego słówka lecą prosto do fiszek, powtórki w pudełkach Leitnera i ćwiczenia z lukami jak na maturze. To PWA, więc instaluje się na telefonie i działa bez internetu.

## Lokalnie

```
npm install
cp .env.example .env.local
npm run dev
```

Bez uzupełnionego `.env.local` działają czasy, tematy i ćwiczenia. Konto, fiszki i tłumacz potrzebują kroków niżej.

Przed commitem odpalam `npm run check` (typy, lint, testy, walidacja treści). Treści leżą w `src/content` jako JSON, a `npm run validate:content` pilnuje, żeby pasowały do schematów.

## Co trzeba ustawić raz

### Firebase

1. Nowy projekt na console.firebase.google.com (plan Spark wystarczy).
2. Authentication → Sign-in method → włączam „E-mail/hasło”.
3. Firestore Database → tworzę bazę w trybie produkcyjnym, region w Europie.
4. Reguły z repo: `npx firebase-tools login`, potem `npx firebase-tools deploy --only firestore:rules --project <id-projektu>` (albo wklejam `firestore.rules` w konsoli).
5. Ustawienia projektu → Twoje aplikacje → aplikacja webowa. Config przepisuję do `VITE_FIREBASE_*` w `.env.local`.
6. Authentication → Settings → Authorized domains: dopisuję `<login>.github.io`.

### Tłumacz (Cloudflare Worker + DeepL)

1. Konto DeepL API Free i klucz API.
2. W folderze `worker`: `npm install`, `npx wrangler login`.
3. `npx wrangler secret put DEEPL_API_KEY`. To jest nazwa sekretu, sam klucz wklejam dopiero, kiedy wrangler o niego zapyta.
4. `npx wrangler secret put ALLOWED_ORIGIN` i na pytanie wpisuję `https://<login>.github.io` (kilka adresów po przecinku, np. z `http://localhost:5173` do testów).
5. `npx wrangler deploy`. Adres workera idzie do `VITE_TRANSLATE_API_URL`.

Wranglera odpalam tylko w folderze `worker`. W głównym folderze `wrangler deploy` próbuje wrzucić całą apkę na Cloudflare i dopisuje swoje rzeczy do `vite.config.ts`.

Klucz DeepL nigdy nie trafia do zmiennych `VITE_*`, bo wszystko z `VITE_` ląduje w publicznym bundlu.

Lokalnie worker czyta te dwie wartości z `worker/.dev.vars`, a startuje go `npm run dev` w folderze `worker`.

### GitHub Pages

1. Settings → Pages → Source: GitHub Actions.
2. Settings → Secrets and variables → Actions → Variables: wszystkie `VITE_FIREBASE_*` i `VITE_TRANSLATE_API_URL` (config Firebase nie jest tajny, więc zwykłe zmienne).
3. `VITE_BASE` workflow ustawia sam na `/<nazwa-repo>/`. Zmienną dodaję tylko przy własnej domenie (wtedy `/`).
4. Push na `main` odpala workflow: sprawdza, buduje i wrzuca na Pages.

### Na telefon

- iPhone: Safari → strona aplikacji → Udostępnij → „Do ekranu początkowego”.
- Android: Chrome → menu ⋮ → „Zainstaluj aplikację” (albo „Dodaj do ekranu głównego”).
