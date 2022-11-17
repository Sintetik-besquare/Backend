# Steps to run the project

1. Fork the project to own repository
2. Clone it down to local machine 
3. Open the project in vscode
4. Command to start docker compose: 
    $ ./run.sh
5.  If can't run $ ./run.sh, try:
    $ chmod +x run.sh
6. Command to stop docker compose: 
    $ docker compose down

## Remark
1. Inside .env file add
    - REDIS_PORT=6379
    - REDIS_PASSWORD= "your own password"
    - EMAIL_HOST="smtp.gmail.com"
    - EMAIL_USER="your own email"
    - EMAIL_PASSWORD="password that you get from google"
    - EMAIL_SENDER="your own email"
    - EMAIL_BASE_URL=http://localhost:3001/user
