import { PgBoss } from 'pg-boss';
import { sendVerificationEmail } from './email.js';

const QUEUE = 'verification-email';

let boss: PgBoss;

export async function initEmailQueue(): Promise<void> {
  boss = new PgBoss({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  await boss.start();
  await boss.createQueue(QUEUE);

  await boss.work<{ email: string; token: string }>(QUEUE, { pollingIntervalSeconds: 5 }, async (jobs) => {
    for (const job of jobs) {
      await sendVerificationEmail(job.data.email, job.data.token);
    }
  });
}

export async function enqueueVerificationEmail(email: string, token: string): Promise<boolean> {
  const jobId = await boss.send(
    QUEUE,
    { email, token },
    {
      singletonKey: email,
      retryLimit: 3,
      retryDelay: 60,
      retryBackoff: true,
    },
  );
  return jobId !== null;
}
