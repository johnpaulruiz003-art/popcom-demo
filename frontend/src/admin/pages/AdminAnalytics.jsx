import React from 'react';
import { GeneralAnalytics } from './GeneralAnalytics.jsx';
import { PmoAnalytics } from './PmoAnalytics.jsx';
import { UsapanAnalytics } from './UsapanAnalytics.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

// Combined Data Analytics page for Admin
export function AdminAnalytics() {
  const { user } = useAuth();
  const greetingName = user?.username && String(user.username).trim()
    ? String(user.username).trim()
    : 'Admin';

  return (
    <div className="analytics-page">
      <header className="analytics-header">
        <div className="analytics-header__copy">
          <h1 className="analytics-page__title">Data Analytics</h1>
          <p className="analytics-page__subtitle">
            Overview of key metrics across General, Pre-Marriage Orientation, and Usapan-Series.
          </p>
        </div>
        <div className="analytics-header__meta">
          <div className="analytics-header__eyebrow">Dashboard</div>
          <p className="analytics-header__greeting">
            Good Day,
            {' '}
            <span>{greetingName}</span>
          </p>
        </div>
      </header>

      <div className="analytics-modules">
        <GeneralAnalytics />
        <PmoAnalytics />
        <UsapanAnalytics />
      </div>
    </div>
  );
}
