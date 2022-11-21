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
1. Inside .env file include
    - POSTGRES_USER
    - POSTGRES_PASSWORD
    - SECRET > must be 32bits
    - PGADMIN_DEFAULT_EMAIL
    - PGADMIN_DEFAULT_PASSWORD
    - REDIS_PORT
    - REDIS_PASSWORD
    - EMAIL_HOST="smtp.gmail.com"
    - EMAIL_USER > your own email
    - EMAIL_PASSWORD > follow this link to obtain email password https://medium.com/@TusharKanjariya/send-email-using-node-mailer-in-node-js-b813734e9a3e
    - EMAIL_SENDER > your own email
    - EMAIL_BASE_URL > http://localhost:3001/user
