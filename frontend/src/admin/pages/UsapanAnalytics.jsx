import React, { useEffect, useMemo, useState } from 'react';
import { Text, Loader, Center } from '@mantine/core';
import { PieChart, BarChart } from '@mantine/charts';
import dayjs from 'dayjs';

import { getCalendarEvents } from '../../api/calendar.js';
import { getAllAppointments } from '../../api/appointments.js';

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

export function UsapanAnalytics() {
  const [month, setMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [showSchedulesMonthlyView, setShowSchedulesMonthlyView] = useState('month');
  const [events, setEvents] = useState([]);
  const [requests, setRequests] = useState([]);

  const fetchData = async (targetMonth) => {
    setLoading(true);
    try {
      const start = dayjs(targetMonth).startOf('year').toISOString();
      const end = dayjs(targetMonth).endOf('year').toISOString();
      const [calendarRes, appointmentsRes] = await Promise.all([
        getCalendarEvents({ start, end }),
        getAllAppointments()
      ]);

      const allEvents = calendarRes.data.data || [];
      setEvents(allEvents.filter((e) => e && e.type === 'Usapan-Series'));

      const allAppointments = appointmentsRes?.data?.data || [];
      setRequests(allAppointments.filter((a) => a && a.service_slug === 'usapan-series'));
    } catch (err) {
      console.error(err);
      setEvents([]);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(month).catch(() => {});
  }, [month]);

  const summary = useMemo(() => {
    const counts = {
      pending: 0,
      scheduled: 0,
      ongoing: 0,
      completed: 0,
      rejected: 0,
      cancelled: 0
    };

    events.forEach((e) => {
      const status = String(e.status || '').trim().toUpperCase();
      if (status === 'PENDING') counts.pending += 1;
      else if (status === 'SCHEDULED') counts.scheduled += 1;
      else if (status === 'ONGOING') counts.ongoing += 1;
      else if (status === 'COMPLETED') counts.completed += 1;
      else if (status === 'REJECTED') counts.rejected += 1;
      else if (status === 'CANCELLED') counts.cancelled += 1;
    });

    return { total: events.length, ...counts };
  }, [events]);

  const scheduleStatusSummary = useMemo(() => {
    const summary = {
      pending: 0,
      scheduled: 0,
      ongoing: 0,
      completed: 0,
      rejected: 0,
      cancelled: 0
    };

    events.forEach((e) => {
      const status = String(e.status || '').trim().toUpperCase();
      if (status === 'PENDING') summary.pending += 1;
      else if (status === 'SCHEDULED') summary.scheduled += 1;
      else if (status === 'ONGOING') summary.ongoing += 1;
      else if (status === 'COMPLETED') summary.completed += 1;
      else if (status === 'REJECTED') summary.rejected += 1;
      else if (status === 'CANCELLED') summary.cancelled += 1;
    });

    return summary;
  }, [events]);

  const scheduleStatusPieData = useMemo(() => {
    const { pending, scheduled, ongoing, completed, rejected, cancelled } = scheduleStatusSummary;
    const total = pending + scheduled + ongoing + completed + rejected + cancelled;
    if (!total) return [];

    const pct = (value) => (value / total) * 100;
    const data = [];
    if (pending) data.push({ label: 'Pending', value: pct(pending), color: '#f59e0b' });
    if (scheduled) data.push({ label: 'Scheduled', value: pct(scheduled), color: '#1d4ed8' });
    if (ongoing) data.push({ label: 'Ongoing', value: pct(ongoing), color: '#e8712b' });
    if (completed) data.push({ label: 'Completed', value: pct(completed), color: '#0d9488' });
    if (rejected) data.push({ label: 'Rejected', value: pct(rejected), color: '#dc2626' });
    if (cancelled) data.push({ label: 'Cancelled', value: pct(cancelled), color: '#64748b' });
    return data;
  }, [scheduleStatusSummary]);

  const schedulesMonthlyData = useMemo(() => {
    const counts = {};
    events.forEach((e) => {
      const d = dayjs(e.startDate || e.dateStr || e.date);
      if (!d.isValid()) return;
      const key = d.format('YYYY-MM');
      counts[key] = (counts[key] || 0) + 1;
    });

    return Object.entries(counts)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([key, count]) => ({ month: dayjs(key + '-01').format('MMM YYYY'), count }));
  }, [events]);

  const schedulesYearlyData = useMemo(() => {
    const counts = {};
    events.forEach((e) => {
      const d = dayjs(e.startDate || e.dateStr || e.date);
      if (!d.isValid()) return;
      const key = d.format('YYYY');
      counts[key] = (counts[key] || 0) + 1;
    });

    return Object.entries(counts)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([year, count]) => ({ year, count }));
  }, [events]);

  return (
    <div className="analytics-page analytics-page--module">
      <header className="analytics-module-header">
        <div>
          <h2 className="analytics-section__title">Usapan-Series - Data Analytics</h2>
          <p className="analytics-section__desc">Key performance indicators and series schedule trends.</p>
        </div>
      </header>

      {loading ? (
        <div className="analytics-skeleton-grid" aria-label="Loading Usapan analytics data">
          <div className="analytics-skeleton-card" />
          <div className="analytics-skeleton-card" />
          <div className="analytics-skeleton-card analytics-skeleton-card--wide" />
        </div>
      ) : (
        <div className="analytics-grid analytics-grid--two">
          <section className="adm-card analytics-card analytics-card--full">
            <div className="adm-chart-head">
              <div>
                <h3 className="adm-card__title">Usapan-Series Overview</h3>
                <p className="adm-card__sub">Program totals across all scheduled series and outreach activities.</p>
              </div>
            </div>

            <div className="analytics-kpi-grid analytics-kpi-grid--five">
              <div className="analytics-kpi adm-kpi adm-kpi--navy">
                <div className="adm-kpi__label">Total schedules</div>
                <div className="adm-kpi__value">{summary.total}</div>
              </div>
              <div className="analytics-kpi adm-kpi adm-kpi--approved">
                <div className="adm-kpi__label">Completed</div>
                <div className="adm-kpi__value">{summary.completed}</div>
              </div>
              <div className="analytics-kpi adm-kpi adm-kpi--pending">
                <div className="adm-kpi__label">Scheduled</div>
                <div className="adm-kpi__value">{summary.scheduled}</div>
              </div>
              <div className="analytics-kpi adm-kpi adm-kpi--rejected">
                <div className="adm-kpi__label">Rejected</div>
                <div className="adm-kpi__value">{summary.rejected}</div>
              </div>
              <div className="analytics-kpi adm-kpi adm-kpi--finished">
                <div className="adm-kpi__label">Cancelled</div>
                <div className="adm-kpi__value">{summary.cancelled}</div>
              </div>
            </div>
          </section>

          <section className="adm-card analytics-card">
            <div className="adm-chart-head">
              <div>
                <h3 className="adm-card__title">Schedule Status</h3>
                <p className="adm-card__sub">Share of all Usapan-Series statuses.</p>
              </div>
            </div>
            {scheduleStatusPieData.length > 0 ? (
              <div className="analytics-pie-wrap" aria-label="Usapan schedule status chart">
                <div className="analytics-pie-chart">
                  <PieChart h={220} withLabels labelsPosition="inside" labelsType="percent" data={scheduleStatusPieData} />
                </div>
                <Legend items={scheduleStatusPieData.map((item) => ({ label: item.label, color: item.color }))} />
              </div>
            ) : (
              <div className="adm-empty">No status data.</div>
            )}
          </section>

          <section className="adm-card analytics-card analytics-card--wide">
            <div className="adm-chart-head">
              <div>
                <h3 className="adm-card__title">Schedules</h3>
                <p className="adm-card__sub">{showSchedulesMonthlyView === 'month' ? 'Schedules per month.' : 'Schedules per year.'}</p>
              </div>
              <ToggleGroup
                label="Usapan schedule view"
                value={showSchedulesMonthlyView}
                onChange={setShowSchedulesMonthlyView}
                options={[{ label: 'Month', value: 'month' }, { label: 'Year', value: 'year' }]}
              />
            </div>
            <div className="analytics-chart" aria-label={`Usapan schedules ${showSchedulesMonthlyView}`}>
              {showSchedulesMonthlyView === 'month' ? (
                schedulesMonthlyData.length > 0 ? (
                  <BarChart h={300} data={schedulesMonthlyData} dataKey="month" series={[{ name: 'count', color: '#0b2a6f' }]} />
                ) : <Center h={220}><Text c="dimmed">No monthly schedule data</Text></Center>
              ) : schedulesYearlyData.length > 0 ? (
                <BarChart h={300} data={schedulesYearlyData} dataKey="year" series={[{ name: 'count', color: '#0b2a6f' }]} />
              ) : <Center h={220}><Text c="dimmed">No yearly schedule data</Text></Center>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

