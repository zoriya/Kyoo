FROM python:3.13
WORKDIR /app

COPY ./requirements.txt .
RUN pip3 install -r ./requirements.txt

COPY . .
ENTRYPOINT ["python3", "-m"]
CMD ["scanner"]
