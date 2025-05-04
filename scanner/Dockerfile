FROM python:3.13
WORKDIR /app

COPY ./requirements.txt .
RUN pip3 install --no-cache-dir --upgrade -r ./requirements.txt

COPY . .

CMD ["fastapi", "run", "scanner", "--port", "4389"]
