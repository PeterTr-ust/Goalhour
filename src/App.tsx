import { useEffect, useState } from 'react';
import { ErrorBanner } from './components/ErrorBanner';
import { MonthView } from './components/MonthView';
import { TabBar, type Tab } from './components/TabBar';
import { requestPersistentStorage } from './db/repository';
import { useAction } from './hooks/useAction';
import { useStoredData } from './hooks/useStoredData';
import { monthKeyOf, toIsoDate } from './lib/calendar';
import type { MonthKey } from './lib/types';

export function App() {
  const data = useStoredData();
  const { error, run, clearError } = useAction();
  const [tab, setTab] = useState<Tab>('month');
  const [month, setMonth] = useState<MonthKey>(() => monthKeyOf(toIsoDate(new Date())));

  useEffect(() => {
    requestPersistentStorage().catch((caught: unknown) => console.error(caught));
  }, []);

  return (
    <div className="min-h-full pt-[calc(env(safe-area-inset-top)+0.75rem)] pr-[max(env(safe-area-inset-right),1rem)] pb-[calc(env(safe-area-inset-bottom)+10rem)] pl-[max(env(safe-area-inset-left),1rem)]">
      <main className="mx-auto max-w-xl">
        {data && tab === 'month' && (
          <MonthView month={month} data={data} onMonthChange={setMonth} run={run} />
        )}
      </main>
      <TabBar active={tab} onChange={setTab} />
      {error && <ErrorBanner message={error} onDismiss={clearError} />}
    </div>
  );
}
