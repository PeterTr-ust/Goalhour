import { useEffect, useState } from 'react';
import { ErrorBanner } from './components/ErrorBanner';
import { ItemSheet } from './components/ItemSheet';
import { MonthView } from './components/MonthView';
import { ServiceYearView } from './components/ServiceYearView';
import { TabBar, type Tab } from './components/TabBar';
import { addItem, requestPersistentStorage } from './db/repository';
import { useAction } from './hooks/useAction';
import { useStoredData } from './hooks/useStoredData';
import { defaultDateForMonth, monthKeyOf, toIsoDate, toTimeString } from './lib/calendar';
import { isMonthClosed } from './lib/month';
import { serviceYearOf } from './lib/serviceYear';
import type { MonthKey } from './lib/types';

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
  const [tab, setTab] = useState<Tab>('month');
  const [month, setMonth] = useState<MonthKey>(currentMonth);
  const [serviceYear, setServiceYear] = useState(() => serviceYearOf(currentMonth()));
  const [adding, setAdding] = useState<AddDefaults | null>(null);

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

  // Adding is only possible on the month tab and while the shown month is open.
  const canAdd = data !== undefined && tab === 'month' && !isMonthClosed(data.closes, month);

  return (
    <div className="min-h-full pt-[calc(env(safe-area-inset-top)+0.75rem)] pr-[max(env(safe-area-inset-right),1rem)] pb-[calc(env(safe-area-inset-bottom)+5.5rem)] pl-[max(env(safe-area-inset-left),1rem)]">
      <main key={tab} className="mx-auto max-w-xl animate-fade-in">
        {data && tab === 'month' && (
          <MonthView month={month} data={data} onMonthChange={setMonth} run={run} />
        )}
        {data && tab === 'serviceYear' && (
          <ServiceYearView
            startYear={serviceYear}
            data={data}
            onYearChange={setServiceYear}
            onOpenMonth={openMonth}
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
      {error && <ErrorBanner message={error} onDismiss={clearError} />}
    </div>
  );
}
