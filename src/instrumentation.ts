export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startFeeReminderCron } = await import('./lib/cron');
    startFeeReminderCron();
  }
}
