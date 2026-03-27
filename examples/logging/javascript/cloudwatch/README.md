# CloudWatch Logs Insights — Saved Query Management

Deploy and manage CloudWatch Logs Insights saved queries from a JSON definition file. Keeps your queries version-controlled, reviewable, and reproducible across environments.

## How It Works

1. **Define queries** in `queries.json` — each query has a name (slash-separated for CloudWatch folder grouping) and the Logs Insights query string.
2. **Run the deploy script** to create or update all queries in your AWS account.
3. **Open CloudWatch Logs Insights** in the AWS Console — your queries appear in the saved queries sidebar, organized by folder.

## Setup

```bash
# Requires: AWS CLI configured with appropriate credentials, Node.js 18+
# Set your region (or it defaults to us-east-1)
export AWS_REGION=us-east-1

# Deploy all queries
node deploy.js

# Delete and recreate all queries (clean slate)
node deploy.js --delete-first

# Verbose output for debugging AWS errors
node deploy.js --verbose
```

## Customizing for Your Project

1. Copy this folder into your project
2. Edit `queries.json`:
   - Set `logGroup` to your CloudWatch log group name
   - Set `queryPrefix` to your project name (used for folder grouping and cleanup)
   - Replace the example queries with your own
3. Add npm scripts to `package.json`:
   ```json
   {
     "scripts": {
       "cw:deploy": "node cloudwatch-queries/deploy.js",
       "cw:deploy:clean": "node cloudwatch-queries/deploy.js --delete-first"
     }
   }
   ```

## Query Design Tips

**Naming convention**: Use slash-separated names for folder grouping in the CloudWatch console:
```
MyApp/Health/Pool Status
MyApp/Errors/All
MyApp/Lookup/By Request ID
```

**Essential query categories** for any service:

| Category | Purpose |
|----------|---------|
| **Errors** | Surface non-info events, exclude known noise |
| **Lookup** | Find all events for a specific correlation ID, user, or entity |
| **Health** | Monitor resource usage, pool sizes, queue depths |
| **Analysis** | Aggregate KPIs — latency percentiles, throughput, error rates |

**Field conventions** the example queries expect (from the Logging Standard):
- `event` — dot-notation event key (e.g., `http.request.completed`)
- `correlationId` — request/workflow correlation ID
- `level` — log level string
- `message` — human-readable message
- `hostname` — originating host
- All domain fields are flattened to top-level keys for easy filtering
