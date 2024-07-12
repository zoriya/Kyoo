# Diagrams
These diagrams are created with Mermaid and rendered locally.  For the best experience, please use a browser.

# Project Structure
Kyoo is a monorepo that consists of several projects each in their own directory.  Diagram below shows an outline of kyoo, projects, and artifacts.

```mermaid
block-beta
  columns 1
  block:proj1:1
    proj_name["Kyoo"]:1
  end
  block:proj2:1
    dir_1["autosync/"]
    dir_2["back/"]
    dir_3["front/"]
    dir_4["transcoder/"]
    dir_5["scanner/"]
  end
  block:proj3:1
    %% columns auto (default)
    block:autosync_b:1
      autosync_i1("kyoo_autosync")
    end
    block:back_b:1
      columns 1
      back_i1("kyoo_back")
      back_i2("kyoo_migrations")
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
      scanner_i2("kyoo_scanner*")
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

  style autosync_b fill:#438dd5,stroke-width:0px
  style back_b fill:#438dd5,stroke-width:0px
  style front_b fill:#438dd5,stroke-width:0px
  style transcoder_b fill:#438dd5,stroke-width:0px
  style scanner_b fill:#438dd5,stroke-width:0px

  style autosync_i1 fill:#85bbf0,stroke-width:0px
  style back_i1 fill:#85bbf0,stroke-width:0px
  style back_i2 fill:#85bbf0,stroke-width:0px
  style front_i1 fill:#85bbf0,stroke-width:0px
  style transcoder_i1 fill:#85bbf0,stroke-width:0px
  style scanner_i1 fill:#85bbf0,stroke-width:0px
  style scanner_i2 fill:#85bbf0,stroke-width:0px
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
  UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="3")

  title Container diagram for Kyoo System

  Person(user, "User")
  System_Boundary(internal, "Kyoo") {
    Container(frontend, "front/")
    Container(backend, "back/")
    ContainerQueue(emb, "emb", "", "EnterpriseMessageBus")
    Container(transcoder, "transcoder/")
    Container(scanner, "scanner/")
    Container(autosync, "autosync/")
  }
  System_Boundary(external, "") {
    System_Ext(content, "ContentDatabase", "")
  }
  System_Boundary(external2, "") {
    System_Ext(tracker, "ActivityTracker", "")
  }
  System_Boundary(external3, "") {
    System_Ext(media, "MediaLibrary", "")
  }

  Rel(user, frontend, "")
  Rel(user, backend, "")
  Rel(frontend, backend, "")
  Rel(backend, emb, "")
  Rel(backend, transcoder, "")
  Rel_Back(autosync, emb, "")
  Rel(autosync, tracker, "")
  Rel_Back(scanner, emb, "")
  Rel(scanner, backend, "")
  Rel(scanner, media, "")
  Rel(scanner, content, "")
  Rel(transcoder, media, "")
```


## Component
### Autosync
```mermaid
C4Component
  UpdateLayoutConfig($c4ShapeInRow="4", $c4BoundaryInRow="2")
  
  title Component Diagram for Autosync
  
  Container_Boundary(autosync, "autosync") {
    Component(autosync_c1, "kyoo_autosync", "python, python3.12", "")
  }
  Container_Boundary(emb, "emb") {
    ComponentQueue(emb_q1, "autosync", "RabbitMQ, Queue", "")
    ComponentQueue(emb_e1, "events.watched", "RabbitMQ, Exchange", "")
    
  }
  Container_Boundary(tracker, "ActivityTracker") {
    Component_Ext(tracker_c1, "TrackerProvider", "API", "simkl")
  }
  Container_Boundary(backend, "back") {
    Component(backend_c2, "kyoo_back", "C#, .NET 8.0", "API Backend")
  }

  Rel(emb_e1, emb_q1, "bound")
  Rel_Back(autosync_c1, emb_q1, "consumes")
  Rel(backend_c2, emb_e1, "produces")
  Rel(autosync_c1, tracker_c1, "updates")
```

### Back
```mermaid
C4Component
  UpdateLayoutConfig($c4ShapeInRow="5", $c4BoundaryInRow="2")
  
  title Component Diagram for Back

  Person(user, "User")

  Container_Boundary(frontend, "front") {
    Component(frontend_c1, "kyoo_front", "typescript, node.js", "Static Content")
  }
  Container_Boundary(backend, "back") {
    ComponentDb(backend_db2, "search", "Meilisearch", "search resource")
    Component(backend_c3, "BackendMetadata", "Volume", "Persistent. Distributed Metadata")
    ComponentDb(backend_db1, "backend", "Postgres", "user data and session state")
    Component(backend_c1, "kyoo_migrations", "C#, .NET 8.0", "Postgres Migration")
    Component(backend_c2, "kyoo_back", "C#, .NET 8.0", "API Backend")
  }

  Container_Boundary(emb, "emb") {
    ComponentQueue(emb_e1, "events.watched", "RabbitMQ, Exchange", "")
    ComponentQueue(emb_q1, "autosync", "RabbitMQ, Queue", "")
    ComponentQueue(emb_q2, "scanner.rescan", "RabbitMQ, Queue", "")
    ComponentQueue(emb_e2, "events.resource", "RabbitMQ, Exchange", "unused")
  }

  Container_Boundary(scanner, "scanner") {
    Component(scanner_c2, "kyoo_scanner", "python, python3.12", "matcher")
    Component(scanner_c1, "kyoo_scanner", "python, python3.12", "scanner")
  }

  Container_Boundary(autosync, "autosync") {
    Component(autosync_c1, "kyoo_autosync", "python, python3.12", "")
  }

  Container_Boundary(transcoder, "transcoder") {
    Component(transcoder_c1, "kyoo_transcoder", "go, go", "Video Transcoder")
  }

  Rel(user, backend_c2, "")
  Rel(backend_c1, backend_db1, "")
  Rel(backend_c2, backend_db1, "")
  Rel(backend_c2, backend_db2, "")
  Rel(backend_c2, transcoder_c1, "")
  Rel(backend_c2, backend_c3, "")
  Rel(backend_c2, emb_q2, "produces")
  Rel(backend_c2, emb_e1, "produces")
  Rel(backend_c2, emb_e2, "produces")
  Rel(emb_e1, emb_q1, "bound")
  Rel_Back(autosync_c1, emb_q1, "consumes")
  Rel_Back(scanner_c1, emb_q2, "consumes")
  Rel(scanner_c1, backend_c2, "")
  Rel(scanner_c2, backend_c2, "")
  Rel(frontend_c1, backend_c2, "")
```

### Front
```mermaid
C4Component
  UpdateLayoutConfig($c4ShapeInRow="4", $c4BoundaryInRow="2")

  title Component Diagram for Front

  Person(user, "User")
  Container_Boundary(frontend, "front") {
    Component(frontend_c1, "kyoo_front", "typescript, node.js", "Static Content")
  }
  Container_Boundary(backend, "back") {
    Component(backend_c2, "kyoo_back", "C#, .NET 8.0", "API Backend")
  }

  Rel(frontend_c1, backend_c2, "ssr")
  Rel(user, frontend_c1, "")
```

### Scanner
```mermaid
C4Component
  UpdateLayoutConfig($c4ShapeInRow="5", $c4BoundaryInRow="3")
  
  title Component Diagram for Scanner

  Container_Boundary(media, "MediaLibrary") {
    Component_Ext(media_c1, "MediaShare", "Volume", "Read Only")
  }

  Container_Boundary(content, "ContentDatabase") {
    Component_Ext(content_c1, "ContentProvider", "API", "tmdb or tvdb")
  }

  Container_Boundary(scanner, "scanner") {
    Component(scanner_c2, "kyoo_scanner", "python, python3.12", "matcher")
    ComponentQueue(scanner_q1, "scanner", "RabbitMQ, Queue", "")
    Component(scanner_c1, "kyoo_scanner", "python, python3.12", "scanner")
  }

  Container_Boundary(backend, "back") {
    Component(backend_c2, "kyoo_back", "C#, .NET 8.0", "API Backend")
  }

  Container_Boundary(emb, "emb") {
    ComponentQueue(emb_q2, "scanner.rescan", "RabbitMQ, Queue", "")
  }

  Rel(scanner_c1, scanner_q1, "produces")
  Rel(scanner_c1, media_c1, "watches")
  Rel(scanner_c1, backend_c2, "Fetch existing scans")
  Rel(scanner_c2, content_c1, "Fetch media data")
  Rel(scanner_c2, backend_c2, "Pushes media data")
  Rel_Back(scanner_c2, scanner_q1, "consumes")
  Rel_Back(scanner_c1, emb_q2, "consumes")
  Rel(backend_c2, emb_q2, "produces")
```

### Transcoder
```mermaid
C4Component
  UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="2")
  
  title Component Diagram for Transcoder

  Container_Boundary(transcoder, "transcoder") {
    Component(transcoder_c2, "TranscodeMetadata", "Volume", "Persistent. Distributed Metadata")
    Component(transcoder_c1, "kyoo_transcoder", "go, go", "Video Transcoder")
    Component(transcoder_c3, "TranscodeCache", "Volume", "Volatile. Local cache")
  }
  Container_Boundary(media, "MediaLibrary") {
    Component_Ext(media_c1, "MediaShare", "Volume", "Read Only")
  }
  Container_Boundary(backend, "back") {
    Component(backend_c2, "kyoo_back", "C#, .NET 8.0", "API Backend")
  }

  Rel(transcoder_c1, media_c1, "mounts")
  Rel(transcoder_c1, transcoder_c2, "")
  Rel(transcoder_c1, transcoder_c3, "")
  Rel(backend_c2, transcoder_c1, "")
```