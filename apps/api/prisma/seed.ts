/**
 * Seeds TEST data only: two demo users with projects and tasks covering every status and
 * priority. Safe to re-run: the demo users are deleted (cascading to their data) and recreated.
 *
 *   npm run db:seed -w @pms/api
 */
import { PrismaClient, type ProjectStatus, type TaskPriority, type TaskStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Password123!';

const day = (offset: number) => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + offset));
};

interface SeedTask {
  name: string;
  priority: TaskPriority;
  status: TaskStatus;
  due: number | null;
  description?: string;
}

interface SeedProject {
  name: string;
  description: string;
  status: ProjectStatus;
  start: number | null;
  end: number | null;
  tasks: SeedTask[];
}

const aliceProjects: SeedProject[] = [
  {
    name: 'Website Redesign',
    description: 'Refresh the marketing site with the new brand guidelines.',
    status: 'IN_PROGRESS',
    start: -14,
    end: 30,
    tasks: [
      { name: 'Audit current pages', priority: 'MEDIUM', status: 'COMPLETED', due: -7 },
      { name: 'Design new homepage', priority: 'HIGH', status: 'IN_PROGRESS', due: 3 },
      { name: 'Write copy for pricing page', priority: 'MEDIUM', status: 'PENDING', due: 10 },
      { name: 'Set up analytics', priority: 'LOW', status: 'PENDING', due: -2, description: 'Overdue on purpose for the demo.' },
    ],
  },
  {
    name: 'Mobile App Launch',
    description: 'Ship v1 of the companion app to the Play Store.',
    status: 'NOT_STARTED',
    start: 7,
    end: 60,
    tasks: [
      { name: 'Prepare store listing', priority: 'MEDIUM', status: 'PENDING', due: 20 },
      { name: 'Beta test with 10 users', priority: 'HIGH', status: 'PENDING', due: 35 },
    ],
  },
  {
    name: 'Q3 Reporting',
    description: 'Quarterly metrics report for the leadership team.',
    status: 'COMPLETED',
    start: -60,
    end: -10,
    tasks: [
      { name: 'Collect metrics', priority: 'HIGH', status: 'COMPLETED', due: -20 },
      { name: 'Build slides', priority: 'MEDIUM', status: 'COMPLETED', due: -12 },
    ],
  },
];

const bobProjects: SeedProject[] = [
  {
    name: 'Office Move',
    description: "Bob's private project — Alice must never see this.",
    status: 'IN_PROGRESS',
    start: -5,
    end: 15,
    tasks: [
      { name: 'Book movers', priority: 'HIGH', status: 'PENDING', due: 2 },
      { name: 'Label boxes', priority: 'LOW', status: 'IN_PROGRESS', due: 5 },
    ],
  },
];

async function createUser(fullName: string, email: string, projects: SeedProject[]) {
  await prisma.user.deleteMany({ where: { email } });
  const user = await prisma.user.create({
    data: { fullName, email, passwordHash: await bcrypt.hash(DEMO_PASSWORD, 12) },
  });
  for (const p of projects) {
    await prisma.project.create({
      data: {
        ownerId: user.id,
        name: p.name,
        description: p.description,
        status: p.status,
        startDate: p.start === null ? null : day(p.start),
        endDate: p.end === null ? null : day(p.end),
        tasks: {
          create: p.tasks.map((t) => ({
            name: t.name,
            description: t.description ?? null,
            priority: t.priority,
            status: t.status,
            dueDate: t.due === null ? null : day(t.due),
            completedAt: t.status === 'COMPLETED' ? new Date() : null,
          })),
        },
      },
    });
  }
  return user;
}

async function main() {
  await createUser('Alice Tester', 'alice@example.com', aliceProjects);
  await createUser('Bob Tester', 'bob@example.com', bobProjects);
  console.log(`Seeded alice@example.com and bob@example.com (password: ${DEMO_PASSWORD})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
