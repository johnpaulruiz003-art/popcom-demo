import React, { useEffect, useMemo, useState } from 'react';
import { Text, Loader, Center } from '@mantine/core';
import { BarChart } from '@mantine/charts';
import dayjs from 'dayjs';
import { showNotification } from '@mantine/notifications';

import { getFeedbackAnalytics } from '../../api/feedback.js';
import { getUsersAnalytics } from '../../api/users.js';
import { getFamilyPlanningAnalytics } from '../../api/familyPlanning.js';

// Approved admin chart palette. Navy leads, blue carries the second series and
// orange marks the onboarding series, so a reader can tell series apart without
// depending on a legend.
const C_NAVY = '#0b2a6f';
const C_BLUE = '#1d4ed8';
const C_ORANGE = '#e8712b';

// "Jan 2026" / "2026" style labels sort correctly when compared as text, but we
// still sort on the underlying date because the API order is not guaranteed.
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthLabel(value) {
  const d = dayjs(value);
  return `${MONTH_LABELS[d.month()]} ${d.format('YYYY')}`;
}

// Sort monthly rows oldest -> newest so the x-axis is chronological.
function toSortedMonthly(rows, pick) {
  return (rows || [])
    .map((r) => ({ ...pick(r), ts: dayjs(r.month).valueOf() }))
    .sort((a, b) => a.ts - b.ts)
    .map(({ ts, ...rest }) => rest);
}

// Sort yearly rows ascending by year number, not lexicographically.
function toSortedYearly(rows) {
  return (rows || [])
    .map((r) => ({ year: String(r.year), count: r.count || 0 }))
    .sort((a, b) => Number(a.year) - Number(b.year));
}

/**
 * Accessible Month | Year toggle. Replaces the old Mantine Switch, whose
 * checked/onLabel/offLabel combination read backwards ("checked" meant Year).
 */
function ViewToggle({ value, onChange, monthLabel: monthText, yearText = 'Year' }) {
  const options = [
    { label: monthText, value: 'month' },
    { label: yearText, value: 'year' }
  ];

  const handleKeyDown = (event, index) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End') {
      return;
    }
    event.preventDefault();
    let nextIndex = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      nextIndex = event.key === 'ArrowRight' ? (index + 1) % options.length : (index - 1 + options.length) % options.length;
    }
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = options.length - 1;
    const nextValue = options[nextIndex].value;
    onChange(nextValue);
  };

  return (
    <div className="analytics-toggle" role="radiogroup" aria-label="Chart time range">
      {options.map((option, index) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          className="analytics-toggle__option"
          tabIndex={value === option.value ? 0 : -1}
          onClick={() => onChange(option.value)}
          onKeyDown={(event) => handleKeyDown(event, index)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// Screen-reader-only summary so every chart has a text equivalent.
function ChartSummary({ children }) {
  return <p className="adm-cap">{children}</p>;
}

function ChartCard({ title, description, toggle, children, className = '' }) {
  return (
    <section className={`adm-card analytics-card ${className}`.trim()}>
      <div className="adm-chart-head">
        <div>
          <h2 className="adm-card__title">{title}</h2>
          <p className="adm-card__sub">{description}</p>
        </div>
        {toggle}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ height = 180, message = 'No data available.' }) {
  return (
    <Center h={height}>
      <div className="analytics-empty" aria-live="polite">
        <div className="analytics-empty__icon" aria-hidden="true">○</div>
        <Text c="dimmed">{message}</Text>
      </div>
    </Center>
  );
}

function LoadingState() {
  return (
    <div className="analytics-skeleton-grid" aria-label="Loading analytics data">
      <div className="analytics-skeleton-card" />
      <div className="analytics-skeleton-card" />
      <div className="analytics-skeleton-card analytics-skeleton-card--wide" />
    </div>
  );
}

export function GeneralAnalytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, totalFeedback: 0 });
  const [barangayData, setBarangayData] = useState([]);
  const [feedbackMonthly, setFeedbackMonthly] = useState([]);
  const [feedbackYearly, setFeedbackYearly] = useState([]);
  const [clientFeedbackMonthly, setClientFeedbackMonthly] = useState([]);
  const [clientFeedbackYearly, setClientFeedbackYearly] = useState([]);
  const [usersMonthly, setUsersMonthly] = useState([]);
  const [feedbackByBarangayMonthly, setFeedbackByBarangayMonthly] = useState([]);
  const [fpMonthly, setFpMonthly] = useState([]);
  const [fpYearly, setFpYearly] = useState([]);
  const [fpStatusCounts, setFpStatusCounts] = useState({ Pending: 0, Approved: 0, Rejected: 0, Cancelled: 0 });
  // 'month' | 'year' - replaces the old inverted booleans.
  const [feedbackView, setFeedbackView] = useState('month');
  const [clientFeedbackView, setClientFeedbackView] = useState('month');
  const [fpView, setFpView] = useState('month');
  const [feedbackByBarangayView, setFeedbackByBarangayView] = useState('barangay');

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      getUsersAnalytics(),
      getFeedbackAnalytics(),
      getFamilyPlanningAnalytics()
    ])
      .then(([usersRes, fbRes, fpRes]) => {
        if (!active) return;
        const u = usersRes?.data?.data || {};
        const f = fbRes?.data?.data || {};
        const fp = fpRes?.data?.data || {};
        setStats({ totalUsers: u.totalUsers || 0, totalFeedback: f.totalFeedback || 0 });
        setBarangayData((u.accountsPerBarangay || []).map((r) => ({ barangay: r.barangay, count: r.count })));
        const fbMonthlyRows = f.feedbackMonthly || [];
        setFeedbackMonthly(toSortedMonthly(fbMonthlyRows, (r) => ({ month: monthLabel(r.month), count: r.count || 0 })));
        // Aggregate system feedback by year for yearly chart
        const fbYearMap = {};
        fbMonthlyRows.forEach((r) => {
          const year = dayjs(r.month).format('YYYY');
          fbYearMap[year] = (fbYearMap[year] || 0) + (r.count || 0);
        });
        setFeedbackYearly(toSortedYearly(Object.entries(fbYearMap).map(([year, count]) => ({ year, count }))));

        // Client feedback (from ClientSatisfactionFeedback)
        const clientMonthlyRows = f.clientFeedbackMonthly || [];
        setClientFeedbackMonthly(
          toSortedMonthly(clientMonthlyRows, (r) => ({ month: monthLabel(r.month), count: r.count || 0 }))
        );
        const clientYearMap = {};
        clientMonthlyRows.forEach((r) => {
          const year = dayjs(r.month).format('YYYY');
          clientYearMap[year] = (clientYearMap[year] || 0) + (r.count || 0);
        });
        setClientFeedbackYearly(toSortedYearly(Object.entries(clientYearMap).map(([year, count]) => ({ year, count }))));
        setUsersMonthly(toSortedMonthly(u.usersMonthly || [], (r) => ({ month: monthLabel(r.month), count: r.count || 0 })));
        setFeedbackByBarangayMonthly(f.feedbackByBarangayMonthly || []);

        const monthlyRows = fp.monthly || [];
        setFpMonthly(toSortedMonthly(monthlyRows, (r) => ({ month: monthLabel(r.month), count: r.count || 0 })));

        // Aggregate by year for yearly chart
        const yearMap = {};
        monthlyRows.forEach((r) => {
          const year = dayjs(r.month).format('YYYY');
          yearMap[year] = (yearMap[year] || 0) + (r.count || 0);
        });
        setFpYearly(toSortedYearly(Object.entries(yearMap).map(([year, count]) => ({ year, count }))));

        const statusRaw = fp.statusCounts || [];
        const statusMap = { Pending: 0, Approved: 0, Rejected: 0, Cancelled: 0 };
        statusRaw.forEach((row) => {
          const key = String(row.status || '').trim();
          if (key && Object.prototype.hasOwnProperty.call(statusMap, key)) {
            statusMap[key] = row.count || 0;
          }
        });
        setFpStatusCounts(statusMap);
      })
      .catch((err) => {
        if (!active) return;
        console.error(err);
        showNotification({ title: 'Error', message: 'Failed to load analytics', color: 'red' });
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Feedback per barangay for the most recent month with data, ranked
  // high -> low. Ranking makes the comparison readable, which the old pie
  // chart plus a detached legend did not.
  const latestFeedbackBarangayRanked = useMemo(() => {
    if (!feedbackByBarangayMonthly.length) return { monthLabel: null, data: [], total: 0 };
    const parsed = feedbackByBarangayMonthly.map((r) => ({
      month: dayjs(r.month),
      barangay: r.barangay,
      count: r.count || 0
    }));
    const latestMonth = parsed.reduce((acc, cur) => (!acc || cur.month.isAfter(acc) ? cur.month : acc), null);
    if (!latestMonth) return { monthLabel: null, data: [], total: 0 };
    const monthKey = latestMonth.startOf('month').valueOf();
    const monthRows = parsed.filter((r) => r.month.startOf('month').valueOf() === monthKey);

    // Merge duplicate barangay rows, then rank by count with name as tiebreak.
    const byName = new Map();
    monthRows.forEach((r) => {
      const name = r.barangay || 'Unspecified';
      byName.set(name, (byName.get(name) || 0) + r.count);
    });

    const data = [...byName.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value || String(a.name).localeCompare(String(b.name)));

    return {
      monthLabel: latestMonth.format('MMMM YYYY'),
      data,
      total: data.reduce((sum, r) => sum + r.value, 0)
    };
  }, [feedbackByBarangayMonthly]);

  if (loading) {
    return <LoadingState />;
  }

  const fpTotal = Object.values(fpStatusCounts).reduce((sum, n) => sum + (n || 0), 0);

  return (
    <div className="analytics-page analytics-page--module">
      <header className="analytics-module-header analytics-module-header--tight">
        <div>
          <h2 className="analytics-section__title">General - Data Analytics</h2>
          <p className="analytics-section__desc">
            Key performance indicators and orientation trends across the portal.
          </p>
        </div>
      </header>

      {/* Family Planning Bookings by Status */}
      <section className="adm-card">
        <h2 className="adm-card__title">Family Planning Bookings by Status</h2>
        <p className="adm-card__sub">
          {fpTotal > 0
            ? `${fpTotal.toLocaleString('en-PH')} booking${fpTotal === 1 ? '' : 's'} recorded in total.`
            : 'No bookings recorded yet.'}
        </p>
        <div className="adm-kpi-grid adm-mt-3">
          {[
            { key: 'Pending', tone: 'pending' },
            { key: 'Approved', tone: 'approved' },
            { key: 'Rejected', tone: 'rejected' },
            { key: 'Cancelled', tone: 'finished' }
          ].map((s) => (
            <div key={s.key} className={`analytics-kpi adm-kpi adm-kpi--${s.tone}`}>
              <div className="adm-kpi__label">{s.key}</div>
              <div className="adm-kpi__value">
                {(fpStatusCounts[s.key] || 0).toLocaleString('en-PH')}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feedback by barangay + Family planning bookings */}
      <div className="adm-chart-grid adm-section">
        <ChartCard
          title="System Feedback by Barangay"
          description={
            feedbackByBarangayView === 'barangay'
              ? latestFeedbackBarangayRanked.monthLabel
                ? `Ranked by volume for ${latestFeedbackBarangayRanked.monthLabel}`
                : 'Ranked by volume, most recent month with data'
              : 'How many feedback entries are received each month'
          }
          toggle={
            <div className="adm-segmented" role="radiogroup" aria-label="System feedback breakdown">
              <button
                type="button"
                role="radio"
                aria-checked={feedbackByBarangayView === 'barangay'}
                className="adm-segmented__opt"
                onClick={() => setFeedbackByBarangayView('barangay')}
              >
                Barangay
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={feedbackByBarangayView === 'month'}
                className="adm-segmented__opt"
                onClick={() => setFeedbackByBarangayView('month')}
              >
                Month
              </button>
            </div>
          }
        >
          {feedbackByBarangayView === 'barangay' ? (
            latestFeedbackBarangayRanked.data.length > 0 ? (
              <>
                <ChartSummary>
                  System feedback by barangay for {latestFeedbackBarangayRanked.monthLabel}, highest first:{' '}
                  {latestFeedbackBarangayRanked.data.map((d) => `${d.name} ${d.value}`).join('; ')}.
                </ChartSummary>
                <ul className="adm-rank" aria-label="Barangay feedback ranking">
                  {(() => {
                    const rows = latestFeedbackBarangayRanked.data.slice(0, 8);
                    const remaining = latestFeedbackBarangayRanked.data.length - rows.length;
                    const allRows = [...rows];
                    if (remaining > 0) {
                      const otherCount = latestFeedbackBarangayRanked.data.slice(8).reduce((sum, row) => sum + row.value, 0);
                      allRows.push({ name: 'Others', value: otherCount });
                    }
                    return allRows.map((d) => {
                      const pct = latestFeedbackBarangayRanked.total
                        ? Math.round((d.value / latestFeedbackBarangayRanked.total) * 100)
                        : 0;
                      return (
                        <li key={d.name} className="adm-rank__row" aria-label={`${d.name}: ${d.value.toLocaleString('en-PH')} response${d.value === 1 ? '' : 's'}, ${pct} percent`}>
                          <div className="adm-rank__meta">
                            <span className="adm-rank__label">{d.name}</span>
                            <span className="adm-rank__value">
                              {d.value.toLocaleString('en-PH')}
                              <span className="adm-rank__pct">{pct}%</span>
                            </span>
                          </div>
                          <span className="adm-rank__track">
                            <span className="adm-rank__fill" style={{ width: `${Math.max(pct, 4)}%`, background: d.name === 'Others' ? '#64748B' : '#0b2a6f' }} />
                          </span>
                        </li>
                      );
                    });
                  })()}
                </ul>
              </>
            ) : (
              <EmptyState />
            )
          ) : feedbackMonthly.length > 0 ? (
            <>
              <ChartSummary>
                System feedback per month: {feedbackMonthly.map((r) => `${r.month} ${r.count}`).join('; ')}.
              </ChartSummary>
              <BarChart
                h={300}
                data={feedbackMonthly}
                dataKey="month"
                series={[{ name: 'count', color: C_BLUE }]}
              />
            </>
          ) : (
            <NoData />
          )}
        </ChartCard>

        <ChartCard
          title="Family Planning Bookings"
          description={
            fpView === 'month'
              ? 'Monthly volume of family planning bookings.'
              : 'Yearly volume of family planning bookings.'
          }
          toggle={<ViewToggle value={fpView} onChange={setFpView} monthLabel="Month" />}
        >
          {fpView === 'month'
            ? fpMonthly.length > 0
              ? (
                <>
                  <ChartSummary>
                    Family planning bookings per month: {fpMonthly.map((r) => `${r.month} ${r.count}`).join('; ')}.
                  </ChartSummary>
                  <div className="analytics-chart" aria-label="Family planning bookings chart">
                    <BarChart h={300} data={fpMonthly} dataKey="month" series={[{ name: 'count', color: C_NAVY }]} />
                  </div>
                </>
              )
              : <EmptyState />
            : fpYearly.length > 0
              ? (
                <>
                  <ChartSummary>
                    Family planning bookings per year: {fpYearly.map((r) => `${r.year} ${r.count}`).join('; ')}.
                  </ChartSummary>
                  <div className="analytics-chart" aria-label="Family planning bookings chart by year">
                    <BarChart h={300} data={fpYearly} dataKey="year" series={[{ name: 'count', color: C_NAVY }]} />
                  </div>
                </>
              )
              : <EmptyState />}
        </ChartCard>
      </div>

      {/* Client feedback + totals */}
      <div className="adm-chart-grid adm-section">
        <ChartCard
          title="Client Feedback Over Time"
          description={
            clientFeedbackView === 'month'
              ? 'Monthly volume of client feedback submitted through the portal.'
              : 'Yearly volume of client feedback submitted through the portal.'
          }
          toggle={<ViewToggle value={clientFeedbackView} onChange={setClientFeedbackView} monthLabel="Month" />}
        >
          {clientFeedbackView === 'month'
            ? clientFeedbackMonthly.length > 0
              ? (
                <>
                  <ChartSummary>
                    Client feedback per month:{' '}
                    {clientFeedbackMonthly.map((r) => `${r.month} ${r.count}`).join('; ')}.
                  </ChartSummary>
                  <div className="analytics-chart" aria-label="Client feedback over time by month">
                    <BarChart
                      h={300}
                      data={clientFeedbackMonthly}
                      dataKey="month"
                      series={[{ name: 'count', color: C_BLUE }]}
                    />
                  </div>
                </>
              )
              : <EmptyState />
            : clientFeedbackYearly.length > 0
              ? (
                <>
                  <ChartSummary>
                    Client feedback per year:{' '}
                    {clientFeedbackYearly.map((r) => `${r.year} ${r.count}`).join('; ')}.
                  </ChartSummary>
                  <div className="analytics-chart" aria-label="Client feedback over time by year">
                    <BarChart
                      h={300}
                      data={clientFeedbackYearly}
                      dataKey="year"
                      series={[{ name: 'count', color: C_BLUE }]}
                    />
                  </div>
                </>
              )
              : <EmptyState />}
        </ChartCard>

        <div className="d-flex flex-column gap-3">
          <section className="adm-card">
            <h2 className="adm-card__title">User &amp; Feedback Totals</h2>
            <p className="adm-card__sub">Overall usage of the portal.</p>
            <div className="analytics-kpi-grid analytics-kpi-grid--two adm-mt-3">
              <div className="analytics-kpi adm-kpi adm-kpi--navy">
                <div className="adm-kpi__label">Total Users</div>
                <div className="adm-kpi__value">{stats.totalUsers.toLocaleString('en-PH')}</div>
              </div>
              <div className="analytics-kpi adm-kpi adm-kpi--blue">
                <div className="adm-kpi__label">Total Feedback</div>
                <div className="adm-kpi__value">{stats.totalFeedback.toLocaleString('en-PH')}</div>
              </div>
            </div>
          </section>

          <ChartCard
            title="New Users per Month"
            description="Onboarding trend for new user accounts."
            className="flex-fill"
          >
            {usersMonthly.length > 0 ? (
              <>
                <ChartSummary>
                  New users per month: {usersMonthly.map((r) => `${r.month} ${r.count}`).join('; ')}.
                </ChartSummary>
                <div className="analytics-chart" aria-label="New users per month">
                  <BarChart
                    h={240}
                    data={usersMonthly}
                    dataKey="month"
                    series={[{ name: 'count', color: C_ORANGE }]}
                  />
                </div>
              </>
            ) : (
              <EmptyState height={200} />
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
