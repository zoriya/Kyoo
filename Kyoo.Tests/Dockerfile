FROM mcr.microsoft.com/dotnet/sdk:5.0
COPY ../ .
RUN dotnet tests '-p:SkipWebApp=true;SkipTranscoder=true' 
