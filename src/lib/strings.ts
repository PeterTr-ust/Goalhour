import type { DurationError } from './duration';
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
    entries: 'Einträge',
    credits: 'Gutschriften',
    carryIn: 'Übertrag aus dem Vormonat',
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
    emptyList: 'Noch keine Einträge in diesem Monat.',
    listTitle: 'Einträge und Gutschriften',
  },
  itemTypes: {
    entry: 'Eintrag',
    credit: 'Gutschrift',
    roundUp: 'Aufrundung',
    carryIn: 'Übertrag',
    carryOut: 'Übertrag',
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
    add: 'Neuer Eintrag',
    dateRequired: 'Bitte ein Datum wählen.',
  },
  goalDialog: {
    title: 'Monatsziel',
    description: (month: string) =>
      `Gilt für ${month} und alle folgenden Monate ohne eigenes Ziel.`,
  },
  closeDialog: {
    title: 'Monat abschließen',
    description: (total: string) =>
      `Das Gesamt von ${total} ist keine volle Stunde. Wie soll der Rest behandelt werden?`,
    roundUp: 'Aufrunden',
    roundUpPreview: (from: string, to: string, added: string) =>
      `${from} wird ${to} (+${added} Aufrundung)`,
    carryOver: 'Übertragen',
    carryOverPreview: (from: string, to: string, rest: string, month: string) =>
      `${from} wird ${to}, ${rest} gehen als Übertrag in den ${month}`,
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
  },
  errors: {
    title: 'Fehler',
    dismiss: 'Schließen',
    monthClosed: 'Der Monat ist abgeschlossen und kann nicht geändert werden.',
    nextMonthClosed: 'Der Folgemonat ist abgeschlossen. Bitte zuerst diesen wieder öffnen.',
    storage: 'Speichern fehlgeschlagen. Bitte erneut versuchen.',
    load: 'Daten konnten nicht geladen werden.',
    duration: {
      invalidNumber: 'Bitte ganze Zahlen eingeben.',
      minutesOutOfRange: 'Minuten müssen zwischen 0 und 59 liegen.',
      negativeHours: 'Stunden dürfen nicht negativ sein.',
      zero: 'Die Dauer muss größer als 0 sein.',
    } satisfies Record<DurationError, string>,
  },
} as const;
