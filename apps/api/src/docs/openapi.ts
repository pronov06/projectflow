/**
 * OpenAPI 3.0 description of the ProjectFlow API, served at /api/docs (Swagger UI)
 * and /api/docs.json (raw spec, importable into Postman).
 */

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const errorRef = (name: string) => ({ $ref: `#/components/responses/${name}` });

const ok = (schema: object, description = 'OK', withMeta = false) => ({
  description,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        required: ['success', 'data'],
        properties: {
          success: { type: 'boolean', example: true },
          data: schema,
          ...(withMeta ? { meta: ref('PaginationMeta') } : {}),
        },
      },
    },
  },
});

const jsonBody = (schema: object) => ({
  required: true,
  content: { 'application/json': { schema } },
});

const idParam = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'uuid' },
};

const pageParams = [
  { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
  { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
  { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
  {
    name: 'search',
    in: 'query',
    description: 'Case-insensitive partial match on name',
    schema: { type: 'string', maxLength: 100 },
  },
];

const secured = [{ bearerAuth: [] }];

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'ProjectFlow API',
    version: '1.0.0',
    description:
      'REST API shared by the ProjectFlow web and mobile apps.\n\n' +
      '**Auth:** call `/api/auth/login` (or register), then send `Authorization: Bearer <accessToken>`. ' +
      'Access tokens live 15 minutes. Browsers receive the refresh token as an httpOnly cookie; native clients ' +
      'that send `X-Client-Platform: mobile` receive it in the response body and send it back in the body of ' +
      '`/api/auth/refresh` and `/api/auth/logout`.\n\n' +
      'All responses use the envelope `{ success, data, meta? }` or `{ success: false, error: { code, message, details? } }`. ' +
      "Resources owned by another user return **404**, so their existence isn't revealed.",
  },
  servers: [{ url: '/', description: 'This server' }],
  tags: [
    { name: 'Auth' },
    { name: 'Projects' },
    { name: 'Tasks' },
    { name: 'Dashboard' },
    { name: 'Audit' },
    { name: 'System' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          fullName: { type: 'string', example: 'Alice Tester' },
          email: { type: 'string', format: 'email', example: 'alice@example.com' },
          role: { type: 'string', enum: ['USER', 'ADMIN'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          user: ref('User'),
          accessToken: { type: 'string' },
          refreshToken: {
            type: 'string',
            description: 'Only present when the request had `X-Client-Platform: mobile`',
          },
        },
      },
      RegisterInput: {
        type: 'object',
        required: ['fullName', 'email', 'password'],
        properties: {
          fullName: { type: 'string', minLength: 2, maxLength: 100, example: 'Alice Tester' },
          email: { type: 'string', format: 'email', example: 'alice@example.com' },
          password: {
            type: 'string',
            minLength: 8,
            maxLength: 72,
            description: 'At least one letter and one number',
            example: 'Password123!',
          },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'alice@example.com' },
          password: { type: 'string', example: 'Password123!' },
        },
      },
      RefreshInput: {
        type: 'object',
        properties: {
          refreshToken: { type: 'string', description: 'Native clients only; browsers use the cookie' },
        },
      },
      Project: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] },
          startDate: { type: 'string', format: 'date', nullable: true },
          endDate: { type: 'string', format: 'date', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          taskCount: { type: 'integer' },
          completedTaskCount: { type: 'integer' },
          progress: { type: 'integer', minimum: 0, maximum: 100 },
        },
      },
      ProjectInput: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 120, example: 'Website redesign' },
          description: { type: 'string', maxLength: 2000, nullable: true },
          status: {
            type: 'string',
            enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'],
            default: 'NOT_STARTED',
          },
          startDate: { type: 'string', format: 'date', nullable: true, example: '2026-10-01' },
          endDate: {
            type: 'string',
            format: 'date',
            nullable: true,
            example: '2026-12-31',
            description: 'Must not be before startDate',
          },
        },
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          projectId: { type: 'string', format: 'uuid' },
          project: {
            type: 'object',
            properties: { id: { type: 'string', format: 'uuid' }, name: { type: 'string' } },
          },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
          status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] },
          dueDate: { type: 'string', format: 'date', nullable: true },
          completedAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      TaskInput: {
        type: 'object',
        required: ['projectId', 'name'],
        properties: {
          projectId: { type: 'string', format: 'uuid', description: 'Must be a project you own' },
          name: { type: 'string', minLength: 1, maxLength: 150, example: 'Write API docs' },
          description: { type: 'string', maxLength: 2000, nullable: true },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
          status: {
            type: 'string',
            enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
            default: 'PENDING',
          },
          dueDate: { type: 'string', format: 'date', nullable: true, example: '2026-10-15' },
        },
      },
      Dashboard: {
        type: 'object',
        properties: {
          totalProjects: { type: 'integer' },
          totalTasks: { type: 'integer' },
          completedTasks: { type: 'integer' },
          pendingTasks: { type: 'integer', description: 'Tasks with status PENDING' },
          inProgressTasks: { type: 'integer' },
          projectsInProgress: { type: 'integer' },
          overdueTasks: { type: 'integer', description: 'Not completed and due before today' },
          projectsByStatus: { type: 'object', additionalProperties: { type: 'integer' } },
          tasksByStatus: { type: 'object', additionalProperties: { type: 'integer' } },
          tasksByPriority: { type: 'object', additionalProperties: { type: 'integer' } },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                enum: [
                  'VALIDATION_ERROR',
                  'BAD_REQUEST',
                  'UNAUTHORIZED',
                  'TOKEN_EXPIRED',
                  'INVALID_CREDENTIALS',
                  'FORBIDDEN',
                  'NOT_FOUND',
                  'CONFLICT',
                  'RATE_LIMITED',
                  'INTERNAL_ERROR',
                ],
              },
              message: { type: 'string' },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { field: { type: 'string' }, message: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    },
    responses: {
      ValidationError: {
        description: 'Validation failed (missing/invalid fields, bad enum, bad date, bad UUID)',
        content: { 'application/json': { schema: ref('Error') } },
      },
      Unauthorized: {
        description: 'Missing/invalid token (`UNAUTHORIZED`) or expired session (`TOKEN_EXPIRED`)',
        content: { 'application/json': { schema: ref('Error') } },
      },
      NotFound: {
        description: "Not found, or it belongs to another user",
        content: { 'application/json': { schema: ref('Error') } },
      },
      RateLimited: {
        description: 'Too many requests',
        content: { 'application/json': { schema: ref('Error') } },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Health check (API + database)',
        responses: { 200: { description: 'Healthy' }, 503: { description: 'Database unreachable' } },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Create an account',
        description: 'Rate limited per IP.',
        requestBody: jsonBody(ref('RegisterInput')),
        responses: {
          201: ok(ref('AuthResponse'), 'Account created and logged in'),
          400: errorRef('ValidationError'),
          409: { description: 'Email already registered', content: { 'application/json': { schema: ref('Error') } } },
          429: errorRef('RateLimited'),
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in',
        description: 'Failed attempts are rate limited per IP + email (default 5 per 15 minutes).',
        requestBody: jsonBody(ref('LoginInput')),
        responses: {
          200: ok(ref('AuthResponse')),
          400: errorRef('ValidationError'),
          401: {
            description: '`INVALID_CREDENTIALS` — same message for unknown email and wrong password',
            content: { 'application/json': { schema: ref('Error') } },
          },
          429: errorRef('RateLimited'),
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Exchange a refresh token for a new access token (rotates the refresh token)',
        requestBody: { content: { 'application/json': { schema: ref('RefreshInput') } } },
        responses: { 200: ok(ref('AuthResponse')), 401: errorRef('Unauthorized') },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Log out (revokes the refresh token, clears the cookie)',
        requestBody: { content: { 'application/json': { schema: ref('RefreshInput') } } },
        responses: { 204: { description: 'Logged out' } },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Current user',
        security: secured,
        responses: { 200: ok(ref('User')), 401: errorRef('Unauthorized') },
      },
    },
    '/api/projects': {
      get: {
        tags: ['Projects'],
        summary: 'List your projects',
        security: secured,
        parameters: [
          ...pageParams,
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] },
          },
          {
            name: 'sortBy',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['createdAt', 'name', 'startDate', 'endDate', 'status'],
              default: 'createdAt',
            },
          },
        ],
        responses: {
          200: ok({ type: 'array', items: ref('Project') }, 'OK', true),
          400: errorRef('ValidationError'),
          401: errorRef('Unauthorized'),
        },
      },
      post: {
        tags: ['Projects'],
        summary: 'Create a project',
        security: secured,
        requestBody: jsonBody(ref('ProjectInput')),
        responses: {
          201: ok(ref('Project'), 'Created'),
          400: errorRef('ValidationError'),
          401: errorRef('Unauthorized'),
        },
      },
    },
    '/api/projects/{id}': {
      parameters: [idParam],
      get: {
        tags: ['Projects'],
        summary: 'Get a project (with task counts and progress)',
        security: secured,
        responses: {
          200: ok(ref('Project')),
          400: errorRef('ValidationError'),
          401: errorRef('Unauthorized'),
          404: errorRef('NotFound'),
        },
      },
      put: {
        tags: ['Projects'],
        summary: 'Update a project (partial: send only the fields to change)',
        security: secured,
        requestBody: jsonBody(ref('ProjectInput')),
        responses: {
          200: ok(ref('Project')),
          400: errorRef('ValidationError'),
          401: errorRef('Unauthorized'),
          404: errorRef('NotFound'),
        },
      },
      delete: {
        tags: ['Projects'],
        summary: 'Delete a project and all of its tasks',
        security: secured,
        responses: {
          204: { description: 'Deleted' },
          401: errorRef('Unauthorized'),
          404: errorRef('NotFound'),
        },
      },
    },
    '/api/tasks': {
      get: {
        tags: ['Tasks'],
        summary: 'List your tasks (across all projects, or one project)',
        security: secured,
        parameters: [
          ...pageParams,
          { name: 'projectId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] },
          },
          { name: 'priority', in: 'query', schema: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] } },
          {
            name: 'sortBy',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['createdAt', 'dueDate', 'priority', 'status', 'name'],
              default: 'createdAt',
            },
          },
        ],
        responses: {
          200: ok({ type: 'array', items: ref('Task') }, 'OK', true),
          400: errorRef('ValidationError'),
          401: errorRef('Unauthorized'),
        },
      },
      post: {
        tags: ['Tasks'],
        summary: 'Create a task in one of your projects',
        security: secured,
        requestBody: jsonBody(ref('TaskInput')),
        responses: {
          201: ok(ref('Task'), 'Created'),
          400: errorRef('ValidationError'),
          401: errorRef('Unauthorized'),
          404: errorRef('NotFound'),
        },
      },
    },
    '/api/tasks/{id}': {
      parameters: [idParam],
      get: {
        tags: ['Tasks'],
        summary: 'Get a task',
        security: secured,
        responses: {
          200: ok(ref('Task')),
          400: errorRef('ValidationError'),
          401: errorRef('Unauthorized'),
          404: errorRef('NotFound'),
        },
      },
      put: {
        tags: ['Tasks'],
        summary: 'Update a task (partial). Use `{ "status": "COMPLETED" }` to mark it complete.',
        security: secured,
        requestBody: jsonBody(ref('TaskInput')),
        responses: {
          200: ok(ref('Task')),
          400: errorRef('ValidationError'),
          401: errorRef('Unauthorized'),
          404: errorRef('NotFound'),
        },
      },
      delete: {
        tags: ['Tasks'],
        summary: 'Delete a task',
        security: secured,
        responses: {
          204: { description: 'Deleted' },
          401: errorRef('Unauthorized'),
          404: errorRef('NotFound'),
        },
      },
    },
    '/api/dashboard': {
      get: {
        tags: ['Dashboard'],
        summary: "Statistics for the authenticated user's projects and tasks",
        security: secured,
        responses: { 200: ok(ref('Dashboard')), 401: errorRef('Unauthorized') },
      },
    },
    '/api/audit-logs': {
      get: {
        tags: ['Audit'],
        summary: 'Your own activity history (newest first)',
        security: secured,
        parameters: pageParams.slice(0, 2),
        responses: { 200: ok({ type: 'array', items: { type: 'object' } }, 'OK', true), 401: errorRef('Unauthorized') },
      },
    },
  },
} as const;
