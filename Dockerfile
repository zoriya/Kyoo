FROM gcc:latest as transcoder
RUN apt-get update && apt-get install -y cmake make libavutil-dev libavcodec-dev libavformat-dev
WORKDIR /transcoder
COPY src/Kyoo.Transcoder .
RUN cmake . && make -j

FROM node:alpine as webapp
WORKDIR /webapp
COPY src/Kyoo.WebApp .
WORKDIR /webapp/Front
RUN npm install
RUN npm run build -- --prod

FROM mcr.microsoft.com/dotnet/sdk:5.0 as builder
COPY . .
RUN dotnet publish -c Release -o /opt/kyoo '-p:SkipWebApp=true;SkipTranscoder=true'

FROM mcr.microsoft.com/dotnet/aspnet:5.0
RUN apt-get update && apt-get install -y libavutil-dev libavcodec-dev libavformat-dev
EXPOSE 5000
COPY --from=builder /opt/kyoo /usr/lib/kyoo
COPY --from=transcoder /transcoder/libtranscoder.so /usr/lib/kyoo
COPY --from=webapp /webapp/Front/dist/* /usr/lib/kyoo/wwwroot/
CMD ["/usr/lib/kyoo/Kyoo.Host.Console"]

