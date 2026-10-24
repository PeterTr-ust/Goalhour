import { useEffect, useState } from 'react';
import { ErrorBanner } from './components/ErrorBanner';
import { MonthView } from './components/MonthView';
import { ServiceYearView } from './components/ServiceYearView';
import { TabBar, type Tab } from './components/TabBar';
import { requestPersistentStorage } from './db/repository';
import { useAction } from './hooks/useAction';
import { useStoredData } from './hooks/useStoredData';
import { monthKeyOf, toIsoDate } from './lib/calendar';
import { serviceYearOf } from './lib/serviceYear';
import type { MonthKey } from './lib/types';

function currentMonth(): MonthKey {
  return monthKeyOf(toIsoDate(new Date()));
}

export function App() {
  const data = useStoredData();
  const { error, run, clearError } = useAction();
  const [tab, setTab] = useState<Tab>('month');
  const [month, setMonth] = useState<MonthKey>(currentMonth);
  const [serviceYear, setServiceYear] = useState(() => serviceYearOf(currentMonth()));

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

  return (
    <div className="min-h-full pt-[calc(env(safe-area-inset-top)+0.75rem)] pr-[max(env(safe-area-inset-right),1rem)] pb-[calc(env(safe-area-inset-bottom)+10rem)] pl-[max(env(safe-area-inset-left),1rem)]">
      <main className="mx-auto max-w-xl">
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
      <TabBar active={tab} onChange={changeTab} />
      {error && <ErrorBanner message={error} onDismiss={clearError} />}
    </div>
  );
}
