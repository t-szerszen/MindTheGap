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
  },
  more: {
    title: 'Wszystko poza czasami',
    subtitle: 'słownictwo, przyimki, spójność tekstu i pisanie',
    settingsHint: 'motyw, konto, synchronizacja',
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
