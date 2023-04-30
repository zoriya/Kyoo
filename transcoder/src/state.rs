use crate::transcode::*;
use crate::utils::Signalable;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::RwLock;

pub struct Transcoder {
	running: RwLock<HashMap<String, TranscodeInfo>>,
}

impl Transcoder {
	pub fn new() -> Transcoder {
		Self {
			running: RwLock::new(HashMap::new()),
		}
	}

	pub async fn build_master(&self, _resource: String, _slug: String) -> String {
		let mut master = String::from("#EXTM3U\n");
		// TODO: Add transmux (original quality) in this master playlist.
		// Transmux should be the first variant since it's used to test bandwidth
		// and serve as a hint for preffered variant for clients.

		// TODO: Fetch kyoo to retrieve the max quality and the aspect_ratio
		let aspect_ratio = 16.0 / 9.0;
		for quality in Quality::iter() {
			master.push_str("#EXT-X-STREAM-INF:");
			master.push_str(format!("AVERAGE-BANDWIDTH={},", quality.average_bitrate()).as_str());
			master.push_str(format!("BANDWIDTH={},", quality.max_bitrate()).as_str());
			master.push_str(
				format!(
					"RESOLUTION={}x{},",
					(aspect_ratio * quality.height() as f32).round() as u32,
					quality.height()
				)
				.as_str(),
			);
			master.push_str("CODECS=\"avc1.640028\"\n");
			master.push_str(format!("./{}/index.m3u8\n", quality).as_str());
		}
		// TODO: Add audio streams
		master
	}

	pub async fn transcode(
		&self,
		client_id: String,
		path: String,
		quality: Quality,
		start_time: u32,
	) -> Result<String, std::io::Error> {
		// TODO: If the stream is not yet up to start_time (and is far), kill it and restart one at the right time.
		// TODO: Clear cache at startup/every X time without use.
		// TODO: cache transcoded output for a show/quality and reuse it for every future requests.
		if let Some(TranscodeInfo {
			show: (old_path, old_qual),
			job,
			uuid,
			..
		}) = self.running.write().unwrap().get_mut(&client_id)
		{
			if path != *old_path || quality != *old_qual {
				// If the job has already ended, interrupt returns an error but we don't care.
				_ = job.interrupt();
			} else {
				let mut path = get_cache_path_from_uuid(uuid);
				path.push("stream.m3u8");
				return std::fs::read_to_string(path);
			}
		}

		let info = transcode_video(path, quality, start_time).await;
		let mut path = get_cache_path(&info);
		path.push("stream.m3u8");
		self.running.write().unwrap().insert(client_id, info);
		std::fs::read_to_string(path)
	}

	// TODO: Use path/quality instead of client_id
	pub async fn get_segment(
		&self,
		client_id: String,
		_path: String,
		_quality: Quality,
		chunk: u32,
	) -> Result<PathBuf, SegmentError> {
		let hashmap = self.running.read().unwrap();
		let info = hashmap.get(&client_id).ok_or(SegmentError::NoTranscode)?;

		// TODO: Check if ready_time is far enough for this fragment to exist.
		let mut path = get_cache_path(&info);
		path.push(format!("segments-{0:02}.ts", chunk));
		Ok(path)
	}
}

pub enum SegmentError {
	NoTranscode,
}
