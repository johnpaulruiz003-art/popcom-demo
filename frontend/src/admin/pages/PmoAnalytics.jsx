import React, { useEffect, useMemo, useState } from 'react';
import { Text, Loader, Center } from '@mantine/core';
import { BarChart, PieChart } from '@mantine/charts';
import dayjs from 'dayjs';

import { getPmoAdminAnalytics } from '../../api/pmoAdmin.js';

function ToggleGroup({ label, value, onChange, options }) {
  const handleKeyDown = (event, index) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End') {
      return;
    }
    event.preventDefault();
    let nextIndex = index;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % options.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + options.length) % options.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = options.length - 1;
    onChange(options[nextIndex].value);
  };

  return (
    <div className="analytics-toggle" role="radiogroup" aria-label={label}>
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

function Legend({ items }) {
  return (
    <div className="analytics-legend" aria-label="Chart legend">
      {items.map((item) => (
        <div key={item.label} className="analytics-legend__item">
          <span className="analytics-legend__swatch" style={{ backgroundColor: item.color }} aria-hidden="true" />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function PmoAnalytics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [appointmentsView, setAppointmentsView] = useState('month');
  const [schedulesView, setSchedulesView] = useState('month');

  useEffect(() => {
    setLoading(true);
    getPmoAdminAnalytics()
      .then((res) => setData(res.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const sortMonthly = (rows) =>
    (rows || [])
      .map((r) => ({ ...r, ts: dayjs(r.month).valueOf() }))
      .sort((a, b) => a.ts - b.ts)
      .map(({ ts, ...rest }) => rest);

  const schedulesMonthlyData = sortMonthly(data?.schedulesMonthly || []).map((r) => ({
    month: dayjs(r.month).format('MMM YYYY'),
    count: r.count,
  }));
  const appointmentsMonthlyData = sortMonthly(data?.appointmentsMonthly || []).map((r) => ({
    month: dayjs(r.month).format('MMM YYYY'),
    count: r.count,
  }));
  const schedulesYearlyData = (data?.schedulesYearly || []).map((r) => ({
    year: dayjs(r.year).format('YYYY'),
    count: r.count,
  }));
  const appointmentsYearlyData = (data?.appointmentsYearly || []).map((r) => ({
    year: dayjs(r.year).format('YYYY'),
    count: r.count,
  }));

  const appointmentStatusSummary = useMemo(() => {
    const rows = data?.appointmentStatusCounts || [];
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let cancelled = 0;

    rows.forEach((r) => {
      const status = String(r.status || '').trim().toUpperCase();
      const count = r.count || 0;
      if (status === 'PENDING') pending += count;
      else if (status === 'APPROVED') approved += count;
      else if (status === 'REJECTED') rejected += count;
      else if (status === 'CANCELLED') cancelled += count;
    });

    return { pending, approved, rejected, cancelled };
  }, [data]);

  const appointmentStatusPieData = useMemo(() => {
    const { pending, approved, rejected, cancelled } = appointmentStatusSummary;
    const total = pending + approved + rejected + cancelled;
    if (!total) return [];

    const pct = (value) => (value / total) * 100;
    return [
      { label: 'Pending', value: pct(pending), color: '#f59e0b' },
      { label: 'Approved', value: pct(approved), color: '#16a34a' },
      { label: 'Rejected', value: pct(rejected), color: '#dc2626' },
      { label: 'Cancelled', value: pct(cancelled), color: '#6b7280' }
    ];
  }, [appointmentStatusSummary]);

  const scheduleStatusSummary = useMemo(() => {
    const rows = data?.scheduleStatusCounts || [];
    let upcoming = 0;
    let finished = 0;
    let cancelled = 0;

    rows.forEach((r) => {
      const status = String(r.status || '').trim().toUpperCase();
      if (status === 'SCHEDULED') {
        upcoming += r.count || 0;
      } else if (status === 'COMPLETED') {
        finished += r.count || 0;
      } else if (status === 'CANCELLED') {
        cancelled += r.count || 0;
      }
    });

    return { upcoming, finished, cancelled };
  }, [data]);

  const scheduleStatusPieData = useMemo(() => {
    const { upcoming, finished, cancelled } = scheduleStatusSummary;
    const total = upcoming + finished + cancelled;
    if (!total) return [];
    const pct = (value) => (value / total) * 100;
    return [
      { label: 'Upcoming', value: pct(upcoming), color: '#1d4ed8' },
      { label: 'Finished', value: pct(finished), color: '#0d9488' },
      { label: 'Cancelled', value: pct(cancelled), color: '#64748b' }
    ];
  }, [scheduleStatusSummary]);

  return (
    <div className="analytics-page analytics-page--module">
      <header className="analytics-module-header">
        <div>
          <h2 className="analytics-section__title">Pre-Marriage Orientation - Data Analytics</h2>
          <p className="analytics-section__desc">Key performance indicators and orientation trends.</p>
        </div>
      </header>

      {loading ? (
        <div className="analytics-skeleton-grid" aria-label="Loading PMO analytics data">
          <div className="analytics-skeleton-card" />
          <div className="analytics-skeleton-card" />
          <div className="analytics-skeleton-card analytics-skeleton-card--wide" />
        </div>
      ) : !data ? (
        <div className="adm-empty" aria-live="polite">No analytics data available.</div>
      ) : (
        <div className="analytics-grid analytics-grid--two">
          <section className="adm-card analytics-card analytics-card--full">
            <div className="adm-chart-head">
              <div>
                <h3 className="adm-card__title">Appointments Overview</h3>
                <p className="adm-card__sub">Current booking totals and status mix.</p>
              </div>
            </div>
            <div className="analytics-kpi-grid analytics-kpi-grid--five">
              <div className="analytics-kpi adm-kpi adm-kpi--navy">
                <div className="adm-kpi__label">Total bookings</div>
                <div className="adm-kpi__value">{data.totalBookings}</div>
              </div>
              <div className="analytics-kpi adm-kpi adm-kpi--pending">
                <div className="adm-kpi__label">Pending</div>
                <div className="adm-kpi__value">{appointmentStatusSummary.pending}</div>
              </div>
              <div className="analytics-kpi adm-kpi adm-kpi--approved">
                <div className="adm-kpi__label">Approved</div>
                <div className="adm-kpi__value">{appointmentStatusSummary.approved}</div>
              </div>
              <div className="analytics-kpi adm-kpi adm-kpi--rejected">
                <div className="adm-kpi__label">Rejected</div>
                <div className="adm-kpi__value">{appointmentStatusSummary.rejected}</div>
              </div>
              <div className="analytics-kpi adm-kpi adm-kpi--finished">
                <div className="adm-kpi__label">Cancelled</div>
                <div className="adm-kpi__value">{appointmentStatusSummary.cancelled}</div>
              </div>
            </div>
          </section>

          <section className="adm-card analytics-card">
            <div className="adm-chart-head">
              <div>
                <h3 className="adm-card__title">Appointment Status</h3>
                <p className="adm-card__sub">Percentage of all appointment statuses.</p>
              </div>
            </div>
            {appointmentStatusPieData.length > 0 ? (
              <div className="analytics-pie-wrap" aria-label="PMO appointment status chart">
                <div className="analytics-pie-chart">
                  <PieChart h={220} withLabels labelsPosition="inside" labelsType="percent" data={appointmentStatusPieData} />
                </div>
                <Legend items={appointmentStatusPieData.map((item) => ({ label: item.label, color: item.color }))} />
              </div>
            ) : (
              <div className="adm-empty">No status data.</div>
            )}
          </section>

          <section className="adm-card analytics-card analytics-card--wide">
            <div className="adm-chart-head">
              <div>
                <h3 className="adm-card__title">Appointments</h3>
                <p className="adm-card__sub">{appointmentsView === 'month' ? 'Monthly booking volume.' : 'Yearly booking volume.'}</p>
              </div>
              <ToggleGroup
                label="Appointments view"
                value={appointmentsView}
                onChange={setAppointmentsView}
                options={[{ label: 'Month', value: 'month' }, { label: 'Year', value: 'year' }]}
              />
            </div>
            <div className="analytics-chart" aria-label={`PMO appointments ${appointmentsView}`}>
              {appointmentsView === 'month' ? (
                appointmentsMonthlyData.length > 0 ? (
                  <BarChart h={300} data={appointmentsMonthlyData} dataKey="month" series={[{ name: 'count', color: '#0b2a6f' }]} />
                ) : <Center h={220}><Text c="dimmed">No monthly appointment data</Text></Center>
              ) : appointmentsYearlyData.length > 0 ? (
                <BarChart h={300} data={appointmentsYearlyData} dataKey="year" series={[{ name: 'count', color: '#0b2a6f' }]} />
              ) : <Center h={220}><Text c="dimmed">No yearly appointment data</Text></Center>}
            </div>
          </section>

          <section className="adm-card analytics-card analytics-card--full">
            <div className="adm-chart-head">
              <div>
                <h3 className="adm-card__title">Schedules Overview</h3>
                <p className="adm-card__sub">Program schedule totals and completion mix.</p>
              </div>
            </div>
            <div className="analytics-kpi-grid analytics-kpi-grid--four">
              <div className="analytics-kpi adm-kpi adm-kpi--navy">
                <div className="adm-kpi__label">Total schedules</div>
                <div className="adm-kpi__value">{scheduleStatusSummary.upcoming + scheduleStatusSummary.finished + scheduleStatusSummary.cancelled}</div>
              </div>
              <div className="analytics-kpi adm-kpi adm-kpi--approved">
                <div className="adm-kpi__label">Finished</div>
                <div className="adm-kpi__value">{scheduleStatusSummary.finished}</div>
              </div>
              <div className="analytics-kpi adm-kpi adm-kpi--pending">
                <div className="adm-kpi__label">Upcoming</div>
                <div className="adm-kpi__value">{scheduleStatusSummary.upcoming}</div>
              </div>
              <div className="analytics-kpi adm-kpi adm-kpi--finished">
                <div className="adm-kpi__label">Cancelled</div>
                <div className="adm-kpi__value">{scheduleStatusSummary.cancelled}</div>
              </div>
            </div>
          </section>

          <section className="adm-card analytics-card analytics-card--wide">
            <div className="adm-chart-head">
              <div>
                <h3 className="adm-card__title">Schedule Status</h3>
                <p className="adm-card__sub">The share of program status values over the selected period.</p>
              </div>
              <ToggleGroup
                label="Schedule status view"
                value={schedulesView}
                onChange={setSchedulesView}
                options={[{ label: 'Month', value: 'month' }, { label: 'Year', value: 'year' }]}
              />
            </div>
            {scheduleStatusPieData.length > 0 ? (
              <div className="analytics-pie-wrap" aria-label="PMO schedule status chart">
                <div className="analytics-pie-chart">
                  <PieChart h={220} withLabels labelsPosition="inside" labelsType="percent" data={scheduleStatusPieData} />
                </div>
                <Legend items={scheduleStatusPieData.map((item) => ({ label: item.label, color: item.color }))} />
              </div>
            ) : (
              <div className="adm-empty">No schedule status data.</div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
