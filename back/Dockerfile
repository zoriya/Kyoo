FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:7.0 as builder
ARG TARGETARCH
WORKDIR /kyoo

COPY Kyoo.sln ./Kyoo.sln
COPY nuget.config ./nuget.config
COPY src/Directory.Build.props src/Directory.Build.props
COPY src/Kyoo.Authentication/Kyoo.Authentication.csproj src/Kyoo.Authentication/Kyoo.Authentication.csproj
COPY src/Kyoo.Abstractions/Kyoo.Abstractions.csproj src/Kyoo.Abstractions/Kyoo.Abstractions.csproj
COPY src/Kyoo.Core/Kyoo.Core.csproj src/Kyoo.Core/Kyoo.Core.csproj
COPY src/Kyoo.Host/Kyoo.Host.csproj src/Kyoo.Host/Kyoo.Host.csproj
COPY src/Kyoo.Postgresql/Kyoo.Postgresql.csproj src/Kyoo.Postgresql/Kyoo.Postgresql.csproj
COPY src/Kyoo.Meilisearch/Kyoo.Meilisearch.csproj src/Kyoo.Meilisearch/Kyoo.Meilisearch.csproj
COPY src/Kyoo.Swagger/Kyoo.Swagger.csproj src/Kyoo.Swagger/Kyoo.Swagger.csproj
COPY tests/Kyoo.Tests/Kyoo.Tests.csproj tests/Kyoo.Tests/Kyoo.Tests.csproj
RUN dotnet restore -a $TARGETARCH

COPY . .
ARG VERSION
RUN dotnet publish -a $TARGETARCH --no-restore -c Release -o /app "-p:Version=${VERSION:-"0.0.0-dev"}" src/Kyoo.Host

FROM mcr.microsoft.com/dotnet/aspnet:7.0
RUN apt-get update && apt-get install -y curl
COPY --from=builder /app /app

WORKDIR /kyoo
EXPOSE 5000
HEALTHCHECK --interval=5s CMD curl --fail http://localhost:5000/health || exit
CMD /app/Kyoo.Host
