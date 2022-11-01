From ubuntu:latest

RUN apt update
RUN apt install python3 -y

WORKDIR /usr/src/app

COPY main.py /usr/src/app

CMD ["python3","./main.py"]