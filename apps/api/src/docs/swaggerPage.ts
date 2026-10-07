import helmet from 'helmet';

/**
 * Swagger UI served from jsDelivr (pinned major) rather than from node_modules, so the docs work
 * identically on a long-running server and on serverless hosts that don't ship static assets.
 */
const SWAGGER_CDN = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5';

export const swaggerHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>ProjectFlow API docs</title>
    <link rel="stylesheet" href="${SWAGGER_CDN}/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="${SWAGGER_CDN}/swagger-ui-bundle.js" crossorigin="anonymous"></script>
    <script src="/api/docs/init.js"></script>
  </body>
</html>`;

export const swaggerInitJs = `window.ui = SwaggerUIBundle({
  url: '/api/docs.json',
  dom_id: '#swagger-ui',
  deepLinking: true,
  persistAuthorization: true,
});`;

/** The global CSP blocks third-party scripts; only the docs page may load the Swagger bundle. */
export const swaggerCsp = helmet.contentSecurityPolicy({
  directives: {
    ...helmet.contentSecurityPolicy.getDefaultDirectives(),
    'script-src': ["'self'", 'https://cdn.jsdelivr.net'],
    'style-src': ["'self'", 'https://cdn.jsdelivr.net', "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https://cdn.jsdelivr.net'],
  },
});
