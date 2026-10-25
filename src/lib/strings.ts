import type { BackupError } from './backup';
import type { DecryptError, PasswordError } from './backupCrypto';
import type { DurationError } from './duration';
import type { WeeksOffError } from './plan';
import { parseMonthKey } from './calendar';
import { formatServiceYear } from './serviceYear';
import type { MonthKey } from './types';

/** All user-visible texts of the app. */

export const LOCALE = 'de-DE';

const monthFormatter = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' });
const monthNameFormatter = new Intl.DateTimeFormat(LOCALE, { month: 'long' });
const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

function monthToDate(key: MonthKey): Date {
  const { year, month } = parseMonthKey(key);
  return new Date(year, month - 1, 1);
}

export function formatMonth(key: MonthKey): string {
  return monthFormatter.format(monthToDate(key));
}

export function formatMonthName(key: MonthKey): string {
  return monthNameFormatter.format(monthToDate(key));
}

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatDateTime(timestamp: number): string {
  return dateTimeFormatter.format(new Date(timestamp));
}

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return dateFormatter.format(new Date(year ?? 0, (month ?? 1) - 1, day ?? 1));
}

export const strings = {
  tabs: {
    label: 'Bereiche',
    month: 'Monat',
    serviceYear: 'Dienstjahr',
  },
  month: {
    previous: 'Vorheriger Monat',
    next: 'Nächster Monat',
    entries: 'Stunden',
    credits: 'Gutschriften',
    carryIn: 'Übertrag aus dem Vormonat',
    creditCarryIn: (month: string) => `davon Übertrag aus ${month}`,
    creditCarryOut: 'Übertrag Gutschrift',
    creditRoundUp: 'Aufrundung Gutschrift',
    total: 'Gesamt',
    provisional: 'vorläufig',
    final: 'endgültig',
    closed: 'Abgeschlossen',
    goal: 'Monatsziel',
    noGoal: 'Kein Ziel',
    setGoal: 'Ziel festlegen',
    editGoal: (value: string) => `Monatsziel ${value}, ändern`,
    missing: 'Noch fehlend',
    reached: 'Ziel erreicht',
    exceeded: 'Ziel überschritten',
    progress: 'Fortschritt zum Monatsziel',
    closeMonth: 'Monat abschließen',
    reopen: 'Wieder öffnen',
    reopenBlocked: 'Zuerst den Folgemonat wieder öffnen.',
    lockedHint: 'Dieser Monat ist abgeschlossen. Zum Ändern wieder öffnen.',
    emptyList: 'In diesem Monat ist noch nichts eingetragen.',
    listTitle: 'Stunden und Gutschriften',
  },
  itemTypes: {
    entry: 'Stunden',
    credit: 'Gutschrift',
    roundUp: 'Aufrundung',
    carryIn: 'Übertrag',
    carryOut: 'Übertrag',
    creditCarry: 'Übertrag Gutschrift',
    creditRoundUp: 'Aufrundung Gutschrift',
  },
  list: {
    carryInFrom: (month: string) => `aus ${month}`,
    carryOutTo: (month: string) => `in ${month}`,
    roundUpNote: 'auf volle Stunde',
    edit: (label: string, date: string, duration: string) =>
      `${label} vom ${date}, ${duration}, bearbeiten`,
  },
  sheet: {
    addTitle: 'Hinzufügen',
    editTitle: 'Bearbeiten',
    type: 'Art',
    date: 'Datum',
    time: 'Uhrzeit',
    duration: 'Dauer',
    hours: 'Stunden',
    minutes: 'Minuten',
    save: 'Speichern',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    confirmDelete: 'Wirklich löschen',
    add: 'Stunden oder Gutschrift hinzufügen',
    dateRequired: 'Bitte ein Datum wählen.',
  },
  goalDialog: {
    title: 'Monatsziel',
    description: (month: string) =>
      `Gilt für ${month} und alle folgenden Monate ohne eigenes Ziel.`,
    yearTitle: 'Jahresziel',
    yearDescription: (serviceYear: string) =>
      `Gilt für das Dienstjahr ${serviceYear} und alle folgenden Dienstjahre ohne eigenes Ziel.`,
  },
  closeDialog: {
    title: 'Monat abschließen',
    description:
      'Nicht alles geht in vollen Stunden auf. Wähle für jeden Teil, wie der Rest behandelt wird.',
    hoursSection: (value: string) => `Stunden ${value}`,
    creditsSection: (value: string) => `Gutschriften ${value}`,
    roundUp: 'Aufrunden',
    roundUpPreview: (from: string, to: string, added: string) =>
      `${from} wird ${to} (+${added} Aufrundung)`,
    carryOver: 'Übertragen',
    carryOverPreview: (from: string, to: string, rest: string, month: string) =>
      `${from} wird ${to}, ${rest} gehen in den ${month}`,
    monthTotal: (total: string) => `Monat gesamt: ${total}`,
    chooseAll: 'Bitte für jeden Teil eine Option wählen.',
    confirm: 'Abschließen',
    carryOverBlocked: 'Nicht möglich, weil der Folgemonat bereits abgeschlossen ist.',
  },
  serviceYear: {
    title: (startYear: number) => `Dienstjahr ${formatServiceYear(startYear)}`,
    previous: 'Vorheriges Dienstjahr',
    next: 'Nächstes Dienstjahr',
    yearTotal: 'Jahressumme',
    goal: 'Ziel',
    difference: 'Differenz',
    open: 'offen',
    closed: 'abgeschlossen',
    noValue: '–',
    openMonth: (month: string) => `${month} öffnen`,
    entries: 'Stunden',
    credits: 'Gutschriften',
    balance: 'Übertrag/Aufrundung',
    total: 'Gesamt',
    breakdown: (entries: string, credits: string) => `Stunden ${entries} · Gutschr. ${credits}`,
    yearGoal: 'Jahresziel',
    setYearGoal: 'Jahresziel festlegen',
    editYearGoal: (value: string) => `Jahresziel ${value}, ändern`,
    progress: 'Fortschritt zum Jahresziel',
  },
  plan: {
    title: 'Planung',
    weeksOff: 'Wochen ohne Dienst',
    weeksValue: (weeks: number) => (weeks === 1 ? '1 Woche' : `${weeks} Wochen`),
    editWeeksOff: (weeks: string) => `Wochen ohne Dienst: ${weeks}, ändern`,
    suggestion: 'Vorschlag pro Monat',
    explanation: (goal: string, activeWeeks: number) =>
      `Jahresziel ${goal} verteilt auf ${activeWeeks} aktive Wochen, umgerechnet auf einen Durchschnittsmonat.`,
    needsGoal: 'Lege ein Jahresziel fest, um einen Vorschlag pro Monat zu erhalten.',
    dialogTitle: 'Wochen ohne Dienst',
    dialogDescription: (serviceYear: string) =>
      `Wie viele Wochen planst du im Dienstjahr ${serviceYear} ohne Dienst (z. B. Urlaub)?`,
    decrease: 'Eine Woche weniger',
    increase: 'Eine Woche mehr',
  },
  settings: {
    open: 'Einstellungen',
    title: 'Einstellungen',
    appearance: 'Darstellung',
    themes: { system: 'Automatisch', light: 'Hell', dark: 'Dunkel' },
    backupTitle: 'Datensicherung',
    backupInfo:
      'Deine Daten liegen nur auf diesem Gerät. Wird die App gelöscht, sind sie ohne Backup verloren. Speichere das Backup zum Beispiel in iCloud Drive.',
    lastBackup: (date: string) => `Letztes Backup: ${date}`,
    noBackup: 'Noch kein Backup erstellt.',
    createBackup: 'Backup erstellen',
    restoreBackup: 'Backup wiederherstellen',
    backupDone: 'Backup erstellt.',
    restoreDone: 'Backup wiederhergestellt.',
    close: 'Fertig',
  },
  exportDialog: {
    title: 'Backup erstellen',
    protect: 'Mit Passwort schützen',
    protectInfo: 'Verschlüsselt das Backup (AES-256). Nur mit dem Passwort lässt es sich öffnen.',
    password: 'Passwort',
    repeat: 'Passwort wiederholen',
    warning:
      'Ohne dieses Passwort lässt sich das Backup nicht wiederherstellen. Bewahre es sicher auf, z. B. in der Passwörter-App.',
    strengthHint: 'Mindestens 4 Zeichen. Längere Passwörter schützen deutlich besser.',
    unprotectedWarning: 'Ohne Passwort kann jeder, der die Datei hat, deine Einträge lesen.',
    prepare: 'Backup vorbereiten',
    preparing: 'Wird verschlüsselt …',
    ready: 'Das Backup ist bereit.',
    readyEncrypted: 'Das verschlüsselte Backup ist bereit.',
    save: 'Sichern oder teilen',
  },
  restore: {
    title: 'Backup wiederherstellen',
    passwordTitle: 'Verschlüsseltes Backup',
    passwordInfo: 'Dieses Backup ist mit einem Passwort geschützt.',
    password: 'Passwort',
    decrypt: 'Entschlüsseln',
    decrypting: 'Wird entschlüsselt …',
    summary: (date: string, items: number, months: number) =>
      `Backup vom ${date}: ${items} ${items === 1 ? 'Eintrag (Stunden oder Gutschrift)' : 'Einträge (Stunden und Gutschriften)'}, ${months} ${months === 1 ? 'abgeschlossener Monat' : 'abgeschlossene Monate'}.`,
    warning: 'Alle aktuellen Daten auf diesem Gerät werden dadurch ersetzt.',
    confirm: 'Ersetzen und wiederherstellen',
  },
  reminder: {
    never: 'Du hast noch kein Backup erstellt.',
    overdue: (days: number) => `Dein letztes Backup ist ${days} Tage alt.`,
    action: 'Jetzt sichern',
  },
  undo: {
    deleted: (label: string) => `${label} gelöscht`,
    action: 'Rückgängig',
  },
  errors: {
    title: 'Fehler',
    dismiss: 'Schließen',
    monthClosed: 'Der Monat ist abgeschlossen und kann nicht geändert werden.',
    nextMonthClosed: 'Der Folgemonat ist abgeschlossen. Bitte zuerst diesen wieder öffnen.',
    storage: 'Speichern fehlgeschlagen. Bitte erneut versuchen.',
    load: 'Daten konnten nicht geladen werden.',
    weeksOff: {
      invalidNumber: 'Bitte eine ganze Zahl eingeben.',
      outOfRange: 'Bitte 0 bis 51 Wochen eingeben.',
    } satisfies Record<WeeksOffError, string>,
    backupExport: 'Das Backup konnte nicht erstellt werden.',
    backupRead: 'Die Datei konnte nicht gelesen werden.',
    password: {
      tooShort: 'Das Passwort muss mindestens 4 Zeichen lang sein.',
      mismatch: 'Die Passwörter stimmen nicht überein.',
    } satisfies Record<PasswordError, string>,
    decrypt: {
      wrongPassword: 'Falsches Passwort oder beschädigte Datei.',
      invalidEnvelope: 'Die verschlüsselte Datei ist beschädigt oder stammt nicht von Goalhour.',
    } satisfies Record<DecryptError, string>,
    backup: {
      invalidJson: 'Die Datei ist kein gültiges Backup (kein JSON).',
      notABackup: 'Die Datei ist kein Goalhour-Backup.',
      unsupportedVersion: 'Dieses Backup stammt aus einer neueren App-Version.',
      invalidData: 'Das Backup enthält fehlerhafte Daten und wurde nicht übernommen.',
    } satisfies Record<BackupError, string>,
    duration: {
      invalidNumber: 'Bitte ganze Zahlen eingeben.',
      minutesOutOfRange: 'Minuten müssen zwischen 0 und 59 liegen.',
      negativeHours: 'Stunden dürfen nicht negativ sein.',
      zero: 'Die Dauer muss größer als 0 sein.',
    } satisfies Record<DurationError, string>,
  },
} as const;
