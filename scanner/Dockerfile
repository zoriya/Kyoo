FROM python:3.12@sha256:19973e1796237522ed1fcc1357c766770b47dc15854eafdda055b65953fe5ec1
WORKDIR /app

COPY ./requirements.txt .
RUN pip3 install -r ./requirements.txt

COPY . .
ENTRYPOINT ["python3", "-m", "scanner", "-v"]
