// wszystkie teksty interfejsu w jednym miejscu

// 1 słówko, 2 słówka, 5 słówek
export function plural(n: number, one: string, few: string, many: string) {
  if (n === 1) return one
  const d = n % 10
  const t = n % 100
  if (d >= 2 && d <= 4 && (t < 12 || t > 14)) return few
  return many
}

export const pl = {
  appName: 'Mind the Gap',
  nav: {
    label: 'Sekcje',
    home: 'Start',
    tenses: 'Czasy',
    translator: 'Tłumacz',
    words: 'Fiszki',
    exercises: 'Ćwiczenia',
    more: 'Więcej',
    settings: 'Ustawienia',
  },
  theme: {
    label: 'Motyw',
    light: 'Jasny',
    dark: 'Ciemny',
    system: 'Systemowy',
    switchTo: (name: string) => `Przełącz motyw, teraz: ${name}`,
  },
  home: {
    notebook: 'Zeszyt',
    subject: 'do języka angielskiego · matura',
    nameLabel: 'imię:',
    title: 'Na dziś',
  },
  settings: {
    title: 'Ustawienia',
    look: 'Wygląd',
    themeHint: (now: string) =>
      `Wybór zapamiętuję na tym urządzeniu. „Systemowy” podąża za ustawieniem telefonu — teraz: ${now}.`,
    systemDark: 'ciemny',
    systemLight: 'jasny',
    calm: 'Ogranicz animacje',
    calmHint: 'zakreślacz i kartki pojawią się od razu',
    version: 'Mind the Gap · wersja 0.1',
    account: 'Konto',
    noName: 'Bez imienia',
    loggedOut: 'Nie jesteś zalogowany — teoria działa, ale fiszki i postęp wymagają konta.',
  },
  more: {
    title: 'Wszystko poza czasami',
    subtitle: 'słownictwo, przyimki, spójność tekstu i pisanie',
    settingsHint: 'motyw, konto, synchronizacja',
  },
  auth: {
    eyebrow: 'Konto',
    loginTitle: 'Zaloguj się',
    registerTitle: 'Załóż konto',
    why: 'żeby fiszki i postęp były te same na telefonie i komputerze',
    name: 'Imię (na okładkę)',
    email: 'E-mail',
    password: 'Hasło',
    passwordHint: 'co najmniej 6 znaków',
    loginBtn: 'Zaloguj się',
    registerBtn: 'Załóż konto',
    toRegister: 'Nie mam konta',
    toLogin: 'Mam już konto',
    forgot: 'Nie pamiętam hasła',
    resetSent: 'Wysłałem link do zmiany hasła — sprawdź skrzynkę (i spam).',
    busy: 'Chwila…',
    logout: 'Wyloguj się',
    signedInAs: (email: string) => `zalogowano: ${email}`,
    notConfigured:
      'Logowanie nie jest jeszcze skonfigurowane (brak VITE_FIREBASE_* w .env). Teoria i ćwiczenia działają bez konta.',
    gateTitle: 'Tu potrzebne jest konto',
    gateText: 'Fiszki, zapisane słówka i postęp trzymam w chmurze, żeby były na każdym urządzeniu.',
    gateBtn: 'Zaloguj się',
    errors: {
      'auth/invalid-email': 'To nie wygląda na adres e-mail.',
      'auth/invalid-credential': 'Zły e-mail albo hasło.',
      'auth/wrong-password': 'Złe hasło.',
      'auth/user-not-found': 'Nie ma konta z tym adresem.',
      'auth/email-already-in-use': 'Ten e-mail ma już konto — zaloguj się.',
      'auth/weak-password': 'Hasło jest za krótkie (min. 6 znaków).',
      'auth/missing-password': 'Wpisz hasło.',
      'auth/too-many-requests': 'Za dużo prób. Odczekaj chwilę i spróbuj znowu.',
      'auth/network-request-failed': 'Brak internetu — logowanie wymaga połączenia.',
    } as Record<string, string>,
    unknownError: 'Coś poszło nie tak. Spróbuj jeszcze raz.',
  },
  common: {
    back: 'Wstecz',
    close: 'Zamknij',
    cancel: 'Anuluj',
    save: 'Zapisz',
    delete: 'Usuń',
    edit: 'Edytuj',
    loading: 'Chwila, przewracam kartki…',
    notFound: 'Tej kartki nie ma w zeszycie.',
    toStart: 'Wróć na start',
  },
}
