import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { theme } from '../theme.js';
import { AdminDashboardPage } from './AdminDashboardPage.jsx';

describe('AdminDashboardPage mock data', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem('useMocks', 'true');
  });

  it('loads mock rows for all dashboard tables', async () => {
    render(
      <MantineProvider theme={theme}>
        <Notifications />
        <AdminDashboardPage />
      </MantineProvider>
    );

    expect(await screen.findByText('Barangay Family Planning Drive')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /announcements/i }));
    expect(await screen.findByText('Health Caravan')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /feedback/i }));
    expect(await screen.findByText('Maria Santos')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /appointments/i }));
    expect(await screen.findByText('Pre-Marriage Orientation')).toBeInTheDocument();
    expect(screen.getByText(/Angela Morado/i)).toBeInTheDocument();
  });
});
