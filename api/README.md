# Kyoo API

## Database schema

The many-to-many relation between entries (episodes/movies) & videos is NOT a mistake. Some video files can contain multiples episodes (like `MyShow 2&3.mvk`). One video file can also contain only a portion of an episode (like `MyShow 2 Part 1.mkv`)

```mermaid
erDiagram
    shows {
        guid id PK
        kind kind "serie|movie"
        string(128) slug UK
        genre[] genres
        int rating "From 0 to 100"
        status status "NN"
        datetime added_date
        date start_air
        date end_air "null for movies"
        datetime next_refresh
        jsonb external_id
        guid studio_id FK
        string original_language
    }
    show_translations {
        guid id PK, FK
        string language PK
        string name "NN"
        string tagline
        string[] aliases
        string description
        string[] tags
        string trailerUrl
        jsonb poster
        jsonb banner
        jsonb logo
        jsonb thumbnail
    }
    shows ||--|{ show_translations : has
    shows |o--|| entries : has

    entries {
        guid id PK
        string(256) slug UK
        guid show_id FK, UK
        %% Order is absolute number.
        uint order "NN"
        uint season_number UK
        uint episode_number UK "NN"
        type type "episode|movie|special|extra"
        date air_date
        uint runtime
        jsonb thumbnail
        datetime next_refresh
        jsonb external_id
    }
    entry_translations {
        guid id PK, FK
        string language PK
        string name
        string description
    }
    entries ||--|{ entry_translations : has

    video {
        guid id PK
        string path "NN"
        uint rendering "dedup for duplicates part1/2"
        uint part
        uint version "max version is preferred rendering"
    }
    video }|--|{ entries : for

    collections {
        guid id PK
        string(256) slug UK
        datetime added_date
        datetime next_refresh
    }

    collection_translations {
        guid id PK, FK
        string language PK
        string name "NN"
        jsonb poster
        jsonb thumbnail
    }
    collections ||--|{ collection_translations : has
    collections |o--|{ shows : has

    seasons {
        guid id PK
        string(256) slug UK
        guid show_id FK
        uint season_number "NN"
        datetime added_date
        date start_air
        date end_air
        datetime next_refresh
        jsonb external_id
    }

    season_translations {
        guid id PK,FK
        string language PK
        string name
        string description
        jsonb poster
        jsonb banner
        jsonb logo
        jsonb thumbnail
    }
    seasons ||--|{ season_translations : has
    seasons ||--o{ entries : has
    shows ||--|{ seasons : has

    watched_shows {
        guid show_id PK, FK
        guid user_id PK, FK
        status status "completed|watching|droped|planned"
        uint seen_entry_count "NN"
    }
    shows ||--|{ watched_shows : has

    watched_entries {
        guid entry_id PK, FK
        guid user_id PK, FK
        uint time "in seconds, null of finished"
        uint progress "NN, from 0 to 100"
        datetime played_date
    }
    entries ||--|{ watched_entries : has

    roles {
        guid show_id PK, FK
        guid staff_id PK, FK
        uint order
        type type "actor|director|writer|producer|music|other"
        jsonb character_image
    }

    role_translations {
        string language PK
        string character_name
    }
    roles||--o{ role_translations : has
    shows ||--|{ roles : has

    staff {
        guid id PK
        string(256) slug UK
        jsonb image
        datetime next_refresh
        jsonb external_id
    }

    staff_translations {
        guid id PK,FK
        string language PK
        string name "NN"
    }
    staff ||--|{ staff_translations : has
    staff ||--|{ roles : has

    studios {
      guid id PK
      string(128) slug UK
      jsonb logo
      datetime next_refresh
      jsonb external_id
    }

    studio_translations {
      guid id PK,FK
      string language PK
      string name
    }
    studios ||--|{ studio_translations : has
    shows ||--|{ studios : has
```
