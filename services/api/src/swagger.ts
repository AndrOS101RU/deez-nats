import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { OpenAPIV3 } from 'openapi-types';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Deez NATS API',
            version: '1.0.0',
            description:
                'A template API with Express.js, NATS JetStream, and PostgreSQL ran on a docker compose stack',
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server',
            },
            {
                url: 'http://localhost:8080',
                description: 'Production server',
            },
        ],
    },
    apis: [
        // Include both source and compiled files to ensure coverage
        './src/**/*.ts',
        './dist/**/*.js',
        // Include the components file
        './src/swagger-components.ts',
    ],
};

const specs = swaggerJsdoc(options) as OpenAPIV3.Document;

export function setupSwagger(app: Express) {
    // Log the generated specs for debugging
    console.log('Swagger specs generated:', {
        paths: Object.keys(specs.paths || {}),
        tags: specs.tags?.length || 0,
        components: specs.components ? Object.keys(specs.components) : [],
        apis: options.apis,
    });

    app.use(
        '/api-docs',
        swaggerUi.serve,
        swaggerUi.setup(specs, {
            explorer: true,
            customCss: '.swagger-ui .topbar { display: none }',
            customSiteTitle: 'Deez NATS API Documentation',
        })
    );

    // Serve the OpenAPI spec as JSON
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(specs);
    });
}
