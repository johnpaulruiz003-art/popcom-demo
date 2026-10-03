const cron = require('node-cron');
const dayjs = require('dayjs');

const db = require('../config/db');
const { sendSMS } = require('../services/textbeeSms');

/**
 * Overdue file-task reminders go out once a day, not on a tight loop.
 * Override the schedule with FILE_TASK_OVERDUE_REMINDER_CRON
 * (standard 5-field cron, evaluated in the server's timezone).
 */
const OVERDUE_REMINDER_CRON = process.env.FILE_TASK_OVERDUE_REMINDER_CRON || '5 7 * * *';

async function logFileTaskOverdueSmsAttempt({ recipient, message, success, providerResponse, errorMessage }) {
  try {
    await db.query(
      `INSERT INTO "SMS_Logs" (
         appointment_id,
         couple_id,
         event_type,
         recipient,
         message,
         success,
         provider_response,
         error_message
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        null, // leave appointment_id null for file tasks to avoid UUID type conflicts
        null,
        'FILETASK_OVERDUE_REMINDER',
        String(recipient || ''),
        String(message || ''),
        Boolean(success),
        providerResponse ? providerResponse : null,
        errorMessage ? String(errorMessage) : null
      ]
    );
  } catch (e) {
    console.error('Failed to write File Task overdue SMS log (job):', e?.message || e);
  }
}

async function sendOverdueTaskReminder(row) {
  const rawContact = row.contact_number || '';
  const contact = String(rawContact).replace(/[^0-9]/g, '');
  if (!contact) return 'no-contact';

  const taskTitle = row.task_title || row.taskTitle || row.tasktitle || 'your assigned task';
  const message = `The task "${taskTitle}" is overdue, please submit the necessary document.`;

  // At most one reminder per recipient per task per calendar day. Any attempt
  // already logged today counts - successful or not - so an unreachable number
  // is not retried over and over. The next attempt happens on the next run.
  const existing = await db.query(
    'SELECT 1 FROM "SMS_Logs" WHERE event_type = $1 AND recipient = $2 AND message = $3 AND created_at >= CURRENT_DATE LIMIT 1',
    ['FILETASK_OVERDUE_REMINDER', contact, message]
  );
  if (existing.rowCount > 0) {
    return 'skipped';
  }

  const smsResult = await sendSMS(contact, message);

  await logFileTaskOverdueSmsAttempt({
    recipient: contact,
    message,
    success: smsResult.success,
    providerResponse: smsResult.success ? smsResult.data : smsResult.error?.data || null,
    errorMessage: smsResult.success ? null : smsResult.error?.message
  });

  if (!smsResult.success) {
    console.error('File Task overdue reminder SMS failed:', smsResult.error?.message || smsResult.error);
    return 'failed';
  }

  return 'sent';
}

function startFileTaskOverdueReminderJob() {
  // Once a day (07:05 by default, server time). Each recipient is reminded at
  // most once per day thanks to the SMS log check in sendOverdueTaskReminder.
  cron.schedule(OVERDUE_REMINDER_CRON, async () => {
    try {
      const now = dayjs();

      // Find tasks assigned to Barangay Officers that are overdue and not yet submitted.
      // We only consider tasks with a specific userID (assigned officer), not global tasks.
      const sql = `
        SELECT
          t."fileTaskID" AS filetaskid,
          t."taskTitle" AS task_title,
          t."submitUntil" AS submit_until,
          u.full_name,
          u.contact_number
        FROM file_tasks t
        JOIN users u ON u.userid = t."userID"
        WHERE
          t."submitUntil" IS NOT NULL
          AND t."submitUntil" < CURRENT_DATE
          AND (t."submittedAt" IS NULL)
          AND COALESCE(t."status", '') <> 'Archived'
      `;

      const result = await db.query(sql);

      let sent = 0;
      let skipped = 0;
      for (const row of result.rows) {
        const outcome = await sendOverdueTaskReminder(row);
        if (outcome === 'sent') sent += 1;
        else if (outcome === 'skipped') skipped += 1;
      }

      // Only report when something was actually sent, so a daily run that has
      // nothing new to say stays quiet instead of logging on every tick.
      if (sent > 0) {
        console.log('File task overdue reminders sent:', {
          sent,
          skipped,
          overdueTasks: result.rows.length,
          at: now.toISOString()
        });
      }
    } catch (e) {
      console.error('File task overdue reminder job failed:', e?.message || e);
    }
  });
}

module.exports = {
  startFileTaskOverdueReminderJob
};
