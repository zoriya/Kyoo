# Diagrams
These diagrams are created with Mermaid and rendered locally.  For the best experience, please use a browser.

# Project Structure
Kyoo is a monorepo that consists of several projects each in their own directory.  Diagram below shows an outline of kyoo, projects, and artifacts.

```mermaid
block
  columns 1
  block:proj1:1
    proj_name["Kyoo"]:1
  end
  block:proj2:1
    dir_1["api/"]
    dir_2["auth/"]
    dir_3["front/"]
    dir_4["transcoder/"]
    dir_5["scanner/"]
  end
  block:proj3:1
    %% columns auto (default)
    block:api_b:1
      autosync_i1("kyoo_api")
    end
    block:auth_b:1
      columns 1
      back_i1("kyoo_auth")
    end
    block:front_b:1
      front_i1("kyoo_front")
    end
    block:transcoder_b:1
      transcoder_i1("kyoo_transcoder")
    end
    block:scanner_b:1
      columns 1
      scanner_i1("kyoo_scanner")
    end
  end

  style proj_name fill:transparent,stroke-width:0px
  style proj1 fill:#1168bd,stroke-width:0px
  style proj2 fill:#1168bd,stroke-width:0px
  style proj3 fill:#1168bd,stroke-width:0px
  
  style dir_1 fill:#438dd5,stroke-width:0px
  style dir_2 fill:#438dd5,stroke-width:0px
  style dir_3 fill:#438dd5,stroke-width:0px
  style dir_4 fill:#438dd5,stroke-width:0px
  style dir_5 fill:#438dd5,stroke-width:0px

  style api_b fill:#438dd5,stroke-width:0px
  style auth_b fill:#438dd5,stroke-width:0px
  style front_b fill:#438dd5,stroke-width:0px
  style transcoder_b fill:#438dd5,stroke-width:0px
  style scanner_b fill:#438dd5,stroke-width:0px

  style autosync_i1 fill:#85bbf0,stroke-width:0px
  style back_i1 fill:#85bbf0,stroke-width:0px
  style front_i1 fill:#85bbf0,stroke-width:0px
  style transcoder_i1 fill:#85bbf0,stroke-width:0px
  style scanner_i1 fill:#85bbf0,stroke-width:0px
```

# C4 Diagrams
Diagrams that focus on capturing project from a high level point of view. Context, Container, Component, Code

## Context
```mermaid
C4Context
  UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="2")  
  
  title Context Diagram for Kyoo
  
  Person(user, "User")
  System(kyoo, "Kyoo", "")
  System_Ext(media, "MediaLibrary", "")
  System_Ext(content, "ContentDatabase", "")
  System_Ext(tracker, "ActivityTracker", "")

  Rel(user, kyoo, "")
  Rel(kyoo, content, "")
  Rel(kyoo, media, "")
  Rel(kyoo, tracker, "")
```

## Container
Messaging is middleware.  EnterpriseMessageBus is for any messaging handled between different projects.
```mermaid
C4Container
  UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")

  title Container diagram for Kyoo System

  Person(user, "User")
  Container(apigateway, "API Gateway")
  Container(auth, "auth")
  Container(transcoder, "transcoder")
  Container(scanner, "scanner")
  Container(frontend, "front")
  System_Ext(media, "MediaLibrary", "")
  System_Ext(content, "ContentDatabase", "")
  Container(api, "api")
  System_Ext(tracker, "ActivityTracker", "")


  Rel(user, apigateway, "")
  Rel(apigateway, frontend, "")
  Rel(apigateway, scanner, "")
  Rel(apigateway, transcoder, "")
  Rel(apigateway, api, "")
  Rel(apigateway, auth, "")
  Rel(frontend, api, "")
  Rel(api, tracker, "")
  Rel(scanner, api, "")
  Rel(scanner, media, "")
  Rel(scanner, content, "")
  Rel(transcoder, media, "")
```
## Component
#### Auth
Kyoo leverages the [API Gateway](https://learn.microsoft.com/en-us/azure/architecture/microservices/design/gateway) approach to microservices and [offloads](https://learn.microsoft.com/en-us/azure/architecture/patterns/gateway-offloading) authentication at the gateway.  Auth microservice is implicitly used by each other microservice for both end user authentication and microservice to microservice communications.  

*Auth microservice will not be directly represented in the other component diagrams.  Instead in their relationsihp, they will specify "auth via middleware".

```mermaid
C4Component
  UpdateLayoutConfig($c4ShapeInRow="5", $c4BoundaryInRow="2")
  
  title Auth Component Diagram

  Container_Boundary(auth, "auth") {
    Component(auth_c1, "kyoo_auth", "Go", "")
    ComponentDb(auth_db1, "kelbi", "Postgres", "")
  }
  Rel(auth_c1, auth_db1, "")
```

#### Api
```mermaid
C4Component
  UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="2")
  
  title Api Component Diagram

  Person(user, "User")
  Container_Boundary(api, "api") {
    ComponentDb(api_db1, "kyoo", "Postgres", "")
    Component(api_c1, "kyoo_api", "TypeScript", "")
    Component(api_c2, "ApiMetadata", "Volume", "Persistent. Distributed Metadata")
  }
  Container_Boundary(scanner, "scanner") {
    Component(scanner_c1, "kyoo_scanner", "Python", "")
  }
  Container_Boundary(front, "front") {
    Component(front_c1, "kyoo_front", "TypeScript", "")
  }

  System_Boundary(external, "") {
    System_Ext(tracker, "ActivityTracker", "")
  }

  Rel(user, api_c1, "auth via middleware")
  Rel(api_c1, api_db1, "")
  Rel(api_c1, api_c2, "")
  Rel(api_c1, tracker, "")
  Rel(scanner_c1, api_c1, "auth via middleware")
  Rel(front_c1, api_c1, "")
```

#### Front
```mermaid
C4Component
  UpdateLayoutConfig($c4ShapeInRow="5", $c4BoundaryInRow="2")
  
  title Front Component Diagram

  Person(user, "User")
  Container_Boundary(front, "front") {
    Component(front_c1, "kyoo_front", "TypeScript", "")
  }

  Container_Boundary(api, "api") {
    Component(api_c1, "kyoo_api", "TypeScript", "")
  }
  Rel(user, front_c1, "")
  Rel(front_c1, api_c1, "")
```


#### Transcoder
```mermaid
C4Component
  UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="1")
  
  title Transcoder Component Diagram

  Person(user, "User")

  Container_Boundary(transcoder, "transcoder") {
    ComponentDb(transcoder_db1, "gocoder", "Postgres", "")
    Component(transcoder_c1, "kyoo_transcoder", "Go", "")
    Component(transcoder_c2, "TranscodeMetadata", "Volume", "Persistent. Distributed Metadata")
    Component(transcoder_c3, "TranscodeCache", "Volume", "Volatile. Local cache")
  }

  System_Boundary(external, "") {
    System_Ext(media, "MediaLibrary", "")
  }

  Rel(user, transcoder_c1, "auth via middleware")
  Rel(transcoder_c1, media, "mounted to filesystem <br/> reads")
  Rel(transcoder_c1, transcoder_db1, "")
  Rel(transcoder_c1, transcoder_c2, "")
  Rel(transcoder_c1, transcoder_c3, "")
```


#### Scanner
```mermaid
C4Component
  UpdateLayoutConfig($c4ShapeInRow="5", $c4BoundaryInRow="2")
  
  title Scanner Component Diagram

  Container_Boundary(api, "api") {
    Component(api_c1, "kyoo_api", "TypeScript", "")
  }

  Container_Boundary(scanner, "scanner") {
    Component(scanner_c1, "kyoo_scanner", "Python", "")
    ComponentDb(scanner_db1, "scanner", "Postgres", "")
  }
  System_Boundary(external, "") {
    System_Ext(content, "ContentDatabase", "")
    System_Ext(media, "MediaLibrary", "")
  }

  Rel(scanner_c1, api_c1, "http(s) <br/> auth via middleware")
  Rel(scanner_c1, scanner_db1, "")
  Rel(scanner_c1, content, "http(s) <br/> gathers media info & images")
  Rel(scanner_c1, media, "mounted to filesystem <br/> watches")
```