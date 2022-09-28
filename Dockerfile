FROM gcc:latest as transcoder
RUN apt-get update && apt-get install -y cmake make libavutil-dev libavcodec-dev libavformat-dev
WORKDIR /transcoder
COPY src/Kyoo.Transcoder .
RUN cmake . && make -j

FROM mcr.microsoft.com/dotnet/sdk:6.0 as builder
WORKDIR /kyoo
COPY .git/ ./.git/
COPY . .
RUN dotnet publish -c Release -o /opt/kyoo '-p:SkipWebApp=true;SkipTranscoder=true;CheckCodingStyle=false' src/Kyoo.Host.Console

FROM mcr.microsoft.com/dotnet/aspnet:6.0
RUN apt-get update && apt-get install -y libavutil-dev libavcodec-dev libavformat-dev
EXPOSE 5000
COPY --from=builder /opt/kyoo /usr/lib/kyoo
COPY --from=transcoder /transcoder/libtranscoder.so /usr/lib/kyoo
CMD ["/usr/lib/kyoo/Kyoo.Host.Console"]

