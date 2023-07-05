use crate::identify::identify;
use crate::paths::get_path;
use crate::transcode::*;
use crate::utils::Signalable;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::RwLock;

pub struct Transcoder {
	running: RwLock<HashMap<String, TranscodeInfo>>,
	audio_jobs: RwLock<Vec<(String, u32)>>,
}

impl Transcoder {
	pub fn new() -> Transcoder {
		Self {
			running: RwLock::new(HashMap::new()),
			audio_jobs: RwLock::new(Vec::new()),
		}
	}

	pub async fn build_master(&self, resource: String, slug: String) -> Option<String> {
		let mut master = String::from("#EXTM3U\n");
		let path = get_path(resource, slug).await.ok()?;
		let info = identify(path).await.ok()?;

		// TODO: Only add this if transmuxing is possible.
		if true {
			// Doc: https://developer.apple.com/documentation/http_live_streaming/example_playlists_for_http_live_streaming/creating_a_multivariant_playlist
			master.push_str("#EXT-X-STREAM-INF:");
			master.push_str(format!("AVERAGE-BANDWIDTH={},", info.video.bitrate).as_str());
			// Approximate a bit more because we can't know the maximum bandwidth.
			master.push_str(
				format!("BANDWIDTH={},", (info.video.bitrate as f32 * 1.2) as u32).as_str(),
			);
			master.push_str(
				format!("RESOLUTION={}x{},", info.video.width, info.video.height).as_str(),
			);
			// TODO: Find codecs in the RFC 6381 format.
			// master.push_str("CODECS=\"avc1.640028\",");
			// TODO: With multiple audio qualities, maybe switch qualities depending on the video quality.
			master.push_str("AUDIO=\"audio\"\n");
			master.push_str(format!("./{}/index.m3u8\n", Quality::Original).as_str());
		}

		let aspect_ratio = info.video.width as f32 / info.video.height as f32;
		// Do not include a quality with the same height as the original (simpler for automatic
		// selection on the client side.)
		for quality in Quality::iter().filter(|x| x.height() < info.video.quality.height()) {
			// Doc: https://developer.apple.com/documentation/http_live_streaming/example_playlists_for_http_live_streaming/creating_a_multivariant_playlist
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
			master.push_str("CODECS=\"avc1.640028\",");
			// TODO: With multiple audio qualities, maybe switch qualities depending on the video quality.
			master.push_str("AUDIO=\"audio\"\n");
			master.push_str(format!("./{}/index.m3u8\n", quality).as_str());
		}
		for audio in info.audios {
			// Doc: https://developer.apple.com/documentation/http_live_streaming/example_playlists_for_http_live_streaming/adding_alternate_media_to_a_playlist
			master.push_str("#EXT-X-MEDIA:TYPE=AUDIO,");
			// The group-id allows to distinguish multiple qualities from multiple variants.
			// We could create another quality set and use group-ids hiqual and lowqual.
			master.push_str("GROUP-ID=\"audio\",");
			if let Some(language) = audio.language.clone() {
				master.push_str(format!("LANGUAGE=\"{}\",", language).as_str());
			}
			// Exoplayer throws if audio tracks dont have names so we always add one.
			if let Some(title) = audio.title {
				master.push_str(format!("NAME=\"{}\",", title).as_str());
			} else if let Some(language) = audio.language {
				master.push_str(format!("NAME=\"{}\",", language).as_str());
			} else {
				master.push_str(format!("NAME=\"Audio {}\",", audio.index).as_str());
			}
			// TODO: Support aac5.1 (and specify the number of channel bellow)
			// master.push_str(format!("CHANNELS=\"{}\",", 2).as_str());
			master.push_str("DEFAULT=YES,");
			master.push_str(format!("URI=\"./audio/{}/index.m3u8\"\n", audio.index).as_str());
		}

		Some(master)
	}

	pub async fn transcode(
		&self,
		client_id: String,
		path: String,
		quality: Quality,
		start_time: u32,
	) -> Result<String, TranscodeError> {
		// TODO: If the stream is not yet up to start_time (and is far), kill it and restart one at the right time.
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
				_ = std::fs::remove_dir_all(get_cache_path_from_uuid(uuid));
			} else {
				let mut path = get_cache_path_from_uuid(uuid);
				path.push("stream.m3u8");
				return std::fs::read_to_string(path).map_err(|e| TranscodeError::ReadError(e));
			}
		}

		let info = transcode_video(path, quality, start_time).await?;
		let mut path = get_cache_path(&info);
		path.push("stream.m3u8");
		self.running.write().unwrap().insert(client_id, info);
		std::fs::read_to_string(path).map_err(|e| TranscodeError::ReadError(e))
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

		// If the segment is in the playlist file, it is available so we don't need to check that.
		let mut path = get_cache_path(&info);
		path.push(format!("segments-{0:02}.ts", chunk));
		Ok(path)
	}

	pub async fn transcode_audio(
		&self,
		path: String,
		audio: u32,
	) -> Result<String, TranscodeError> {
		let mut stream = PathBuf::from(get_audio_path(&path, audio));
		stream.push("stream.m3u8");

		if !self
			.audio_jobs
			.read()
			.unwrap()
			.contains(&(path.clone(), audio))
		{
			// TODO: If two concurrent requests for the same audio came, the first one will
			// initialize the transcode and wait for the second segment while the second will use
			// the same transcode but not wait and retrieve a potentially invalid playlist file.
			self.audio_jobs.write().unwrap().push((path.clone(), audio));
			transcode_audio(path, audio).await?;
		}
		std::fs::read_to_string(stream).map_err(|e| TranscodeError::ReadError(e))
	}

	pub async fn get_audio_segment(
		&self,
		path: String,
		audio: u32,
		chunk: u32,
	) -> Result<PathBuf, std::io::Error> {
		let mut path = PathBuf::from(get_audio_path(&path, audio));
		path.push(format!("segments-{0:02}.ts", chunk));
		Ok(path)
	}
}

pub enum SegmentError {
	NoTranscode,
}
