import { useCallback, useEffect, useState } from 'react';
import { AppHeader } from './components/AppHeader';
import { BackupReminder } from './components/BackupReminder';
import { ErrorBanner } from './components/ErrorBanner';
import { ItemSheet } from './components/ItemSheet';
import { MonthView } from './components/MonthView';
import { ServiceYearView } from './components/ServiceYearView';
import { SettingsSheet } from './components/SettingsSheet';
import { TabBar, type Tab } from './components/TabBar';
import { Toast } from './components/Toast';
import { addItem, requestPersistentStorage, restoreItem } from './db/repository';
import { useAction } from './hooks/useAction';
import { useBackupExport } from './hooks/useBackupExport';
import { useStoredData } from './hooks/useStoredData';
import { useTheme } from './hooks/useTheme';
import { useToast } from './hooks/useToast';
import { daysSince, needsBackupReminder } from './lib/backup';
import { defaultDateForMonth, monthKeyOf, toIsoDate, toTimeString } from './lib/calendar';
import { isMonthClosed } from './lib/month';
import { serviceYearOf } from './lib/serviceYear';
import { strings } from './lib/strings';
import type { Item, MonthKey } from './lib/types';

function currentMonth(): MonthKey {
  return monthKeyOf(toIsoDate(new Date()));
}

interface AddDefaults {
  date: string;
  time: string;
}

export function App() {
  const data = useStoredData();
  const { error, run, clearError } = useAction();
  const { toast, show: showToast, dismiss: dismissToast } = useToast();
  const { preference: theme, setPreference: setTheme } = useTheme();
  const [tab, setTab] = useState<Tab>('month');
  const [month, setMonth] = useState<MonthKey>(currentMonth);
  const [serviceYear, setServiceYear] = useState(() => serviceYearOf(currentMonth()));
  const [adding, setAdding] = useState<AddDefaults | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Captured once per app start; enough for a reminder measured in days.
  const [now] = useState(() => Date.now());
  const showMessage = useCallback((message: string) => showToast(message), [showToast]);
  const exportBackup = useBackupExport(data, run, showMessage);

  useEffect(() => {
    requestPersistentStorage().catch((caught: unknown) => console.error(caught));
  }, []);

  const openMonth = (target: MonthKey) => {
    setMonth(target);
    setTab('month');
    window.scrollTo({ top: 0 });
  };

  const changeTab = (target: Tab) => {
    setTab(target);
    window.scrollTo({ top: 0 });
  };

  const openAddSheet = () => {
    const now = new Date();
    setAdding({ date: defaultDateForMonth(month, now), time: toTimeString(now) });
  };

  const handleItemDeleted = (item: Item) => {
    showToast(strings.undo.deleted(strings.itemTypes[item.type]), {
      label: strings.undo.action,
      onClick: () => {
        dismissToast();
        void run(() => restoreItem(item));
      },
    });
  };

  // Adding is only possible on the month tab and while the shown month is open.
  const canAdd = data !== undefined && tab === 'month' && !isMonthClosed(data.closes, month);
  const showReminder =
    data !== undefined &&
    tab === 'month' &&
    needsBackupReminder(data.lastBackupAt, data.items.length, now);

  return (
    <div className="min-h-full pt-[calc(env(safe-area-inset-top)+0.25rem)] pr-[max(env(safe-area-inset-right),1rem)] pb-[calc(env(safe-area-inset-bottom)+5.5rem)] pl-[max(env(safe-area-inset-left),1rem)]">
      {/* Covers the status bar area so scrolled content does not run under the clock. */}
      <div
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-20 h-[env(safe-area-inset-top)] bg-bg/85 backdrop-blur-xl"
      />
      <div className="mx-auto max-w-xl">
        <AppHeader onOpenSettings={() => setSettingsOpen(true)} />
      </div>
      <main key={tab} className="mx-auto flex max-w-xl animate-fade-in flex-col gap-4">
        {showReminder && (
          <BackupReminder
            daysSinceBackup={daysSince(data.lastBackupAt, now)}
            onBackup={exportBackup}
          />
        )}
        {data && tab === 'month' && (
          <MonthView
            month={month}
            data={data}
            onMonthChange={setMonth}
            onItemDeleted={handleItemDeleted}
            onNotify={showMessage}
            run={run}
          />
        )}
        {data && tab === 'serviceYear' && (
          <ServiceYearView
            startYear={serviceYear}
            data={data}
            onYearChange={setServiceYear}
            onOpenMonth={openMonth}
            run={run}
          />
        )}
      </main>
      <TabBar active={tab} onChange={changeTab} onAdd={canAdd ? openAddSheet : undefined} />
      {adding && (
        <ItemSheet
          item={undefined}
          defaultDate={adding.date}
          defaultTime={adding.time}
          onSave={(input) => run(() => addItem(input))}
          onClose={() => setAdding(null)}
        />
      )}
      {settingsOpen && (
        <SettingsSheet
          theme={theme}
          onThemeChange={setTheme}
          lastBackupAt={data?.lastBackupAt}
          onExport={exportBackup}
          onRestored={showMessage}
          run={run}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      {toast && <Toast key={toast.id} toast={toast} />}
      {error && <ErrorBanner message={error} onDismiss={clearError} />}
    </div>
  );
}
