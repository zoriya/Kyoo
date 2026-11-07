# Distributed transcoding and how playback works

Kyoo provides videos via [HTTP live streaming](https://www.cloudflare.com/learning/video/what-is-http-live-streaming/) (HLS). HLS is comprised of two components: a "playlist" (using the `.m3u8` file extension), and "transport stream segments", or "segments" (using the `.ts` file extension). Playlists contain a set of segments, which are pieces of the video being streamed. When playing a video, the client first requests a playlist of the video, and then requests segments of the video, as needed.

Segments can be generated from videos as-is (direct playback), or transcoded. Kyoo supports both options. Transcoding is on the fly, slightly ahead of when a client is expected to request segments. Transcoding may be done one segment at a time, or in batches, which generally results in better transcoding performance. Once segments are transcoded, they are cached in the storage backend (filesystem, S3) for a user-configurable duration, and eventually removed when they have not been recently accessed. Cleanup is handled as a background job, and old segments may not be removed immediately.

The transcoding service is designed to be highly available. When multiple transcoding service instances are deployed at once and configured properly, users should not notice when at least one service fails. This holds true even when the failed instance(s) were transcoding a video being actively played. This is because Kyoo supports _distributed, parallel transcoding_. The service can be configured so that a minimum number of transcoder instances will transcode the parts of the same video. When multiple instances transcode the same parts of the same video at the same time, only one has to succeed for each segments for transcoding to be successful.

Because no two segments are guaranteed to come from the same transcoder instance, it is critical that all segments are entirely independent of each other, and do not overlap. "Parallel segments", or segments covering the same video and same time range that are produced by different instances, must always start with a [I-frame](https://en.wikipedia.org/wiki/Video_compression_picture_types). The start-finish time interval of parallel segments must also match up exactly, with no extra (or missing) frames. Additionally, for interoperability with direct playback, segments must line up exactly with keyframes in the source video. See [here](https://zoriya.dev/blogs/transcoder/) for more information.

## Playback

### Playlist requests
```mermaid
sequenceDiagram
    participant cvp as Client video player
    box Transcoder service (1..N)
        participant api as Web API
        participant jobs as Job worker
    end
    box Backend (HA)
        participant db as Postgres
        participant fs as Storage
    end

    cvp ->> api: Request playlist
    api ->> db:  Get video metadata (segmentation times)
    db -->> api: Return result
    critical Metadata not available
        api -->> api: Generate metadata
        api -) db: Cache metadata
    end
    api ->> api: Generate playlist
    api -) db: Create transcoding job for first k segments
    api ->> cvp: Return video playlist
```

### Segment requests
```mermaid
sequenceDiagram
    participant cvp as Client video player
    box Transcoder service (1..N)
        participant api as Web API
        participant jobs as Job worker
    end
    box Backend (HA)
        participant db as Postgres
        participant fs as Storage
    end

    cvp ->> api: Requests video segment
    loop Until segment is available
        critical Get segment URL
            api ->> db: Request segment URL (worker, S3)
        option Segment exists, not pending deletion
            db ->> db: Update segment access time<br/>via trigger (for cleanup)
            db -->> api: Return URL
        option Segment pending deletion
            db -->> api: Return not available
        option Segment does not exist, job not in progress
            db ->> db: Create transcoding job for k segments
            db -->> api: Return not available
        end
    end
    api ->> storage: Request segment
    storage -->> api: Return segment
    api -->> cvp: Return segment
```

### Segment cleanup
```mermaid
sequenceDiagram
    participant cvp as Client video player
    box Transcoder service (1..N)
        participant api as Web API
        participant jobs as Job worker
    end
    box Backend (HA)
        participant db as Postgres
        participant fs as Storage
    end

    loop pg_cron: trigger every time duration d
        db ->> db: Create segment cleanup job
        worker ->> storage: Get all segments
        storage -->> worker: Return segments
        loop For each segment
            critical Cleanup old segments
                worker ->> db: Get last accessed time
            option No record, segment older than expiration time t, or<br/>Record exists, segment access time older than expiration time t
                worker ->> db: Mark segment as "pending deletion"
                worker ->> storage: Delete segment
                worker ->> db: Delete segment record
            end
        end
    end
```

### Job creation and processing
```mermaid
sequenceDiagram
    participant cvp as Client video player
    box Transcoder service (1..N)
        participant api as Web API
        participant jobs as Job worker
    end
    box Backend (HA)
        participant db as Postgres
        participant fs as Storage
    end

    api ->> db: Add job details to job type-specific jobs table, if matching job not in progress
    api ->> db: NOTIFY job is available with job type, ID as payload
    db ->> worker: Forward the NOTIFY payload to all workers

    worker ->> db: Get job details from job type-specific jobs table
    db -->> worker: Return job details
    worker ->> worker: If job can be accepted (allow for job-specific logic here),<br/>set to "pending" state in thread-safe job processing map
    worker ->> db: Record worker taking job in the job type-specific processing table,<br/>IF below desired worker count (count matching rows)
    critical Job processing
    option Other workers already processing job
        worker ->> worker: Remove job from job processing map
    option Job is cancelled, completed elsewhere
        db ->> worker: Forward the NOTIFY payload to the listener
        worker ->> worker: Cancel job context
    option Job acceptance was successfully recorded
        worker ->> worker: Set job state to "processing" in job processing map
        worker ->> worker: Process job
        worker ->> storage: Upload result to storage (if needed)
        worker ->> db: Update records (if needed)
        loop retry on failure
            worker ->> db: Record job completion type (pass, fail), runtime<br/>(jobs table, processing table)
            worker ->> db: Record error (if any) in job type-specific error table
            worker ->> db: NOTIFY job is complete with job type, ID as payload
        end
        db -) api: Forward the NOTIFY payload to all API instances
        db -) worker: Forward the NOTIFY payload to all API instances
        worker ->> worker: Remove job from processing map
    end
```

### Job tracker cleanup
```mermaid
sequenceDiagram
    participant cvp as Client video player
    box Transcoder service (1..N)
        participant api as Web API
        participant jobs as Job worker
    end
    box Backend (HA)
        participant db as Postgres
        participant fs as Storage
    end

    loop pg_cron: trigger every time duration d
        loop For each job type
            db ->> db: Delete old jobs (cascade delete processing records)
        end
    end
```

### Worker startup
```mermaid
sequenceDiagram
    participant cvp as Client video player
    box Transcoder service (1..N)
        participant api as Web API
        participant jobs as Job worker
    end
    box Backend (HA)
        participant db as Postgres
        participant fs as Storage
    end

    worker ->> db: LISTEN for job notifications
    worker ->> db: Look for available (pending) jobs
    worker ->> worker: Process pending jobs (see Jobs section)
```
