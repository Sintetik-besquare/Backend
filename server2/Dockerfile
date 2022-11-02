From ubuntu:latest
# FROM python:3-onbuild

RUN apt update
RUN apt install python3 -y

WORKDIR /usr/src/app

# COPY requirements.txt requirements.txt
# RUN pip install --no-cache-dir -r requirements.txt
# RUN python -m pip install redis

COPY main.py /usr/src/app

CMD ["python3","./main.py"]