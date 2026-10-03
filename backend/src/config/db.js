const { Pool } = require('pg');
const config = require('./env');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Cap the pool so we stay well under the Supabase pooler's connection limit.
  max: 10,
  // Close clients promptly instead of holding sessions the pooler will reap.
  idleTimeoutMillis: 10000,
  // Fail fast rather than hanging a request forever if the DB is unreachable.
  connectionTimeoutMillis: 10000,
  // Detect broken TCP connections before handing out a dead client.
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
});

// An idle client can be reaped by the Supabase transaction pooler at any time.
// That is a normal, recoverable event: node-postgres already discards the dead
// client, so the next query transparently opens a fresh one. Exiting the
// process here would take the whole API down and turn unrelated in-flight
// requests into 500s, so we only log.
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client:', err.message);
});

// A pool-level error (e.g. the backing Postgres instance restarts) affects every
// pending query. Retrying those queries is safe here because the app only issues
// parameterised SELECT/INSERT/UPDATE/DELETE statements outside of explicit
// transactions, so a failure cannot leave a partial write committed.
const RETRYABLE_CODES = new Set([
  '08000', // connection_exception
  '08003', // connection_does_not_exist
  '08006', // connection_failure
  '08001', // sqlclient_unable_to_establish_sqlconnection
  '08004', // sqlserver_rejected_establishment_of_sqlconnection
  '57P01', // admin_shutdown
  '57P02', // crash_shutdown
  '57P03', // cannot_connect_now
  'ECONNRESET',
  'ECONNREFUSED',
  'EPIPE',
  'ETIMEDOUT',
  'EHOSTUNREACH',
  'ENETUNREACH'
]);

const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 100;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isRetryable(err) {
  if (!err) return false;
  if (RETRYABLE_CODES.has(err.code)) return true;
  // node-postgres surfaces a dead-but-not-yet-detected client this way.
  return /Client has encountered a connection error|Connection terminated|timeout exceeded/i.test(
    err.message || ''
  );
}

async function queryWithRetry(text, params, attempt = 0) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    if (isRetryable(err) && attempt < MAX_RETRIES) {
      const delay = RETRY_BASE_DELAY_MS * 2 ** attempt;
      console.error(
        `Database connection error (${err.code || 'unknown'}); retrying in ${delay}ms ` +
          `(attempt ${attempt + 1}/${MAX_RETRIES})`
      );
      await sleep(delay);
      return queryWithRetry(text, params, attempt + 1);
    }
    throw err;
  }
}

module.exports = {
  query: queryWithRetry,
  pool,
};
