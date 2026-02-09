# Environment Variables

The following environment variables are required to run the State Machine Portal:

## Required Variables

- `STATE_MACHINE_SERVICE_URL` - URL of your downstream state machine service
    - Example: `http://localhost:9090`
    - Default: `http://localhost:9090`

## Optional Variables

- `PORT` - Port to run the application on
    - Default: `3000`
- `DATABASE_URL` - PostgreSQL connection string
    - Required for database operations
- `NEXT_PUBLIC_*` - Any public environment variables

## Example .env file

```env
STATE_MACHINE_SERVICE_URL=http://your-state-machine-service:9090
DATABASE_URL=postgresql://user:password@host:5432/database
