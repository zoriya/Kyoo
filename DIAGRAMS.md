# C4 Diagrams
C4 stands for Context, Container, Component, Code.  

# Context
```mermaid
    C4Context

      title Context diagram for Kyoo System
      Person(user, "User")

      System(kyoo, "Kyoo", "Self-hosted media server focused on video content.")
      System_Ext(media, "MediaLibrary", "")
      System_Ext(content, "ContentDatabase", "Media Info. Artwork, etc.")
      System_Ext(tracker, "ActivityTracker", "")


      Rel(user, kyoo, "watches")

      Rel(kyoo, content, "fetches metadata, title screen, backgrounds, etc")
      Rel(kyoo, media, "media content source")
      Rel(kyoo, tracker, "update tracking")

      UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="1")
```
# Container
```mermaid
    C4Container

      title Container diagram for Kyoo System
      Person(user, "User")

      System_Boundary(s1, "Kyoo") {
        Container(frontend, "frontend")
        Container(backend, "backend")
        Container(scanner, "scanner")
        Container(autosync, "autosync")
        Container(sharem, "sharemessage")
        Container(transcoder, "transcoder")
      }

      System_Ext(media, "MediaLibrary", "")
      System_Ext(content, "ContentDatabase", "")
      System_Ext(tracker, "ActivityTracker", "")

      Rel(user, frontend, "/")
      Rel(user, backend, "/api")
      Rel(frontend, backend, "")
      Rel(backend, sharem, "")
      Rel(backend, media, "")
      Rel(backend, transcoder, "")
      Rel(autosync, sharem, "")
      Rel(autosync, tracker, "")
      Rel(scanner, sharem, "")
      Rel(scanner, media, "")
      Rel(scanner, content, "")
      Rel(transcoder, media, "")

      BiRel(backend, scanner, "")

      UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")

```


# Component
Ideally this would be per component drill down, instead of global
```mermaid
    C4Component

      title Component diagram for Kyoo
      UpdateLayoutConfig($c4ShapeInRow="4", $c4BoundaryInRow="2")

      Person(user, "User")

      System_Boundary(s1, "Kyoo") {

        Container_Boundary(backend, "backend") {
          ComponentDb(backend_db2, "search", "Meilisearch", "search resource")
          Component(backend_c2, "kyoo_back", "C#, .NET 8.0", "API Backend")
          Component(backend_c3, "BackendMetadata", "Volume", "Persistent. Distributed Metadata")
          Component(backend_c1, "kyoo_migrations", "C#, .NET 8.0", "Postgres Migration")
          ComponentDb(backend_db1, "backend", "Postgres", "user data and session state")
        }

        Container_Boundary(frontend, "frontend") {
          Component(frontend_c1, "kyoo_front", "typescript, node.js", "Static Content")
        }

        Container_Boundary(sharem, "sharemessage") {
          ComponentQueue(sharem_e1, "events.watched", "RabbitMQ, Exchange", "")
          ComponentQueue(sharem_e2, "events.resource", "RabbitMQ, Exchange", "")
          ComponentQueue(sharem_q1, "autosync", "RabbitMQ, Queue", "")
          ComponentQueue(sharem_q2, "scanner.rescan", "RabbitMQ, Queue", "")
        }

        Container_Boundary(autosync, "autosync") {
          Component(autosync_c1, "kyoo_autosync", "python, python3.12", "")
        }

        Container_Boundary(scanner, "scanner") {
          Component(scanner_c2, "kyoo_scanner", "python, python3.12", "matcher. no clue")
          Component(scanner_c1, "kyoo_scanner", "python, python3.12", "no clue")
          ComponentQueue(scanner_q1, "scanner", "RabbitMQ", "")
        }

        Container_Boundary(transcoder, "transcoder") {
          Component(transcoder_c1, "kyoo_transcoder", "go, go", "Video Transcoder")
          Component(transcoder_c2, "TranscodeMetadata", "Volume", "Persistent. Distributed Metadata")
          Component(transcoder_c3, "TranscodeCache", "Volume", "Volatile. Local cache")
        }


      }
  
  Container_Boundary(media, "MediaLibrary") {
    Component_Ext(media_c1, "MediaShare", "Volume", "Read Only")
  }

  Container_Boundary(content, "ContentDatabase") {
    Component_Ext(content_c1, "ContentProvider", "API", "tmdb or tvdb")
  }

  Container_Boundary(tracker, "ActivityTracker") {
    Component_Ext(tracker_c1, "TrackerProvider", "API", "simkl")
  }

  Rel(user, frontend_c1, "")
  Rel(user, backend_c2, "")

  Rel(backend_c1, backend_db1, "Managed schema")
  Rel(backend_c2, backend_db1, "")
  Rel(backend_c2, backend_db2, "")
  Rel(backend_c2, sharem_q2, "produces")
  Rel(backend_c2, sharem_e1, "produces")
  Rel(backend_c2, sharem_e2, "produces")
  Rel(backend_c2, backend_c3, "")
  Rel(backend_c2, media_c1, "")
  Rel(backend_c2, transcoder_c1, "")

  Rel(autosync_c1, tracker_c1, "")
  Rel(autosync_c1, sharem_q1, "consumes")

  Rel(frontend_c1, backend_c2, "")

  Rel(scanner_c1, content_c1, "Fetch media metadata")
  Rel(scanner_c1, scanner_q1, "consumes")
  Rel(scanner_c2, content_c1, "Fetch media metadata")
  Rel(scanner_c2, backend_c2, "Pushes media metadata")
  Rel(scanner_c2, scanner_q1, "produces")
  Rel(scanner_c2, sharem_q2, "consumes")
  Rel(scanner_c1, media_c1, "")
  Rel(scanner_c2, media_c1, "")

  Rel(transcoder_c1, media_c1, "")
  Rel(transcoder_c1, transcoder_c2, "")
  Rel(transcoder_c1, transcoder_c3, "")

  Rel(sharem_e1, sharem_q1, "bound")

  BiRel(backend_c2, scanner_c1, "Request/Push media metadata")

```
