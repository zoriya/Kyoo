# Kyoo API

## Database schema

The many-to-many relation between entries (episodes/movies) & videos is NOT a mistake. Some video files can contain multiples episodes (like `MyShow 2&3.mvk`). One video file can also contain only a portion of an episode (like `MyShow 2 Part 1.mkv`)

```mermaid
erDiagram
	shows {
		guid id PK
		kind kind "serie|movie|collection"
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
		guid collection_id FK
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
	shows |o--|| shows : has_collection

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

	users {
		guid id PK
	}

	watched_shows {
		guid show_id PK, FK
		guid user_id PK, FK
		status status "completed|watching|dropped|planned"
		uint seen_entry_count "NN"
		guid next_entry FK
	}
	shows ||--|{ watched_shows : has
	users ||--|{ watched_shows : has
	watched_shows ||--|o entries : next_entry

	history {
		int id PK
		guid entry_id FK
		guid profile_id FK
		guid video_id FK
		jsonb progress "{ percent, time }"
		datetime played_date
	}
	entries ||--|{ history : part_of
	users ||--|{ history : has
	videos o|--o{ history : has

	roles {
		guid show_id PK, FK
		guid staff_id PK, FK
		uint order
		type type "actor|director|writer|producer|music|other"
		string character_name
		string character_latin_name
		jsonb character_image
	}
	staff {
		guid id PK
		string(256) slug UK
		string name "NN"
		string latin_name
		jsonb image
		datetime next_refresh
		jsonb external_id
	}
	staff ||--|{ roles : has
	shows ||--|{ roles : has

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
	shows }|--|{ studios : has
```
