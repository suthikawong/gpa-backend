## Deployment Instructions

1. Run the following command to start the containers:

```bash
docker compose up -d
```

2. Once the containers are running, connect to the database using the connection details provided in the ".env" file.

3. Run the SQL script in the "init.sql" file to initialize the data.

4. After completing the steps above, the API will be available at:
   http://localhost:3000
