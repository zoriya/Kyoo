use derive_more::Display;
use rand::distributions::Alphanumeric;
use rand::{thread_rng, Rng};
use serde::Serialize;
use std::collections::HashMap;
use std::path::PathBuf;
use std::process::Stdio;
use std::slice::Iter;
use std::str::FromStr;
use std::sync::RwLock;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::{Child, Command};
use tokio::sync::watch::{self, Receiver};

use crate::utils::Signalable;

#[derive(PartialEq, Eq, Serialize, Display)]
pub enum Quality {
	#[display(fmt = "240p")]
	P240,
	#[display(fmt = "360p")]
	P360,
	#[display(fmt = "480p")]
	P480,
	#[display(fmt = "720p")]
	P720,
	#[display(fmt = "1080p")]
	P1080,
	#[display(fmt = "1440p")]
	P1440,
	#[display(fmt = "4k")]
	P4k,
	#[display(fmt = "8k")]
	P8k,
	#[display(fmt = "original")]
	Original,
}

impl Quality {
	fn iter() -> Iter<'static, Quality> {
		static QUALITIES: [Quality; 8] = [
			Quality::P240,
			Quality::P360,
			Quality::P480,
			Quality::P720,
			Quality::P1080,
			Quality::P1440,
			Quality::P4k,
			Quality::P8k,
			// Purposfully removing Original from this list (since it require special treatments
			// anyways)
		];
		QUALITIES.iter()
	}

	fn height(&self) -> u32 {
		match self {
			Self::P240 => 240,
			Self::P360 => 360,
			Self::P480 => 480,
			Self::P720 => 720,
			Self::P1080 => 1080,
			Self::P1440 => 1440,
			Self::P4k => 2160,
			Self::P8k => 4320,
			Self::Original => panic!("Original quality must be handled specially"),
		}
	}

	// I'm not entierly sure about the values for bitrates. Double checking would be nice.
	fn average_bitrate(&self) -> u32 {
		match self {
			Self::P240 => 400_000,
			Self::P360 => 800_000,
			Self::P480 => 1200_000,
			Self::P720 => 2400_000,
			Self::P1080 => 4800_000,
			Self::P1440 => 9600_000,
			Self::P4k => 16_000_000,
			Self::P8k => 28_000_000,
			Self::Original => panic!("Original quality must be handled specially"),
		}
	}

	fn max_bitrate(&self) -> u32 {
		match self {
			Self::P240 => 700_000,
			Self::P360 => 1400_000,
			Self::P480 => 2100_000,
			Self::P720 => 4000_000,
			Self::P1080 => 8000_000,
			Self::P1440 => 12_000_000,
			Self::P4k => 28_000_000,
			Self::P8k => 40_000_000,
			Self::Original => panic!("Original quality must be handled specially"),
		}
	}
}

#[derive(Debug, PartialEq, Eq)]
pub struct InvalidValueError;

impl FromStr for Quality {
	type Err = InvalidValueError;

	fn from_str(s: &str) -> Result<Self, Self::Err> {
		match s {
			"240p" => Ok(Quality::P240),
			"360p" => Ok(Quality::P360),
			"480p" => Ok(Quality::P480),
			"720p" => Ok(Quality::P720),
			"1080p" => Ok(Quality::P1080),
			"1440p" => Ok(Quality::P1440),
			"4k" => Ok(Quality::P4k),
			"8k" => Ok(Quality::P8k),
			"original" => Ok(Quality::Original),
			_ => Err(InvalidValueError),
		}
	}
}

fn get_transcode_video_quality_args(quality: &Quality, segment_time: u32) -> Vec<String> {
	if *quality == Quality::Original {
		return vec!["-map", "0:v:0", "-c:v", "copy"]
			.iter()
			.map(|a| a.to_string())
			.collect();
	}
	vec![
		// superfast or ultrafast would produce a file extremly big so we prever veryfast.
		vec![
			"-map", "0:v:0", "-c:v", "libx264", "-crf", "21", "-preset", "veryfast",
		],
		vec![
			"-vf",
			format!("scale=-2:'min({height},ih)'", height = quality.height()).as_str(),
		],
		// Even less sure but bufsize are 5x the avergae bitrate since the average bitrate is only
		// useful for hls segments.
		vec!["-bufsize", (quality.max_bitrate() * 5).to_string().as_str()],
		vec!["-b:v", quality.average_bitrate().to_string().as_str()],
		vec!["-maxrate", quality.max_bitrate().to_string().as_str()],
		// Force segments to be exactly segment_time (only works when transcoding)
		vec![
			"-force_key_frames",
			format!("expr:gte(t,n_forced*{segment_time})").as_str(),
			"-strict",
			"-2",
			"-segment_time_delta",
			"0.1",
		],
	]
	.concat()
	.iter()
	.map(|arg| arg.to_string())
	.collect()
}

// TODO: Add audios streams (and transcode them only when necesarry)
async fn start_transcode(path: String, quality: Quality, start_time: u32) -> TranscodeInfo {
	// TODO: Use the out path below once cached segments can be reused.
	// let out_dir = format!("/cache/{show_hash}/{quality}");
	let uuid: String = thread_rng()
		.sample_iter(&Alphanumeric)
		.take(30)
		.map(char::from)
		.collect();
	let out_dir = format!("/cache/{uuid}");
	std::fs::create_dir(&out_dir).expect("Could not create cache directory");

	let segment_time: u32 = 10;
	let mut cmd = Command::new("ffmpeg");
	cmd.args(&["-progress", "pipe:1"])
		.arg("-nostats")
		.args(&["-ss", start_time.to_string().as_str()])
		.args(&["-i", path.as_str()])
		.args(&["-f", "hls"])
		// Use a .tmp file for segments (.ts files)
		.args(&["-hls_flags", "temp_file"])
		// Cache can't be allowed since switching quality means starting a new encode for now.
		// .args(&["-hls_allow_cache", "1"])
		// Keep all segments in the list (else only last X are presents, useful for livestreams)
		.args(&["-hls_list_size", "0"])
		.args(&["-hls_time", segment_time.to_string().as_str()])
		.args(get_transcode_video_quality_args(&quality, segment_time))
		.args(&[
			"-hls_segment_filename".to_string(),
			format!("{out_dir}/segments-%02d.ts"),
			format!("{out_dir}/stream.m3u8"),
		])
		.stdout(Stdio::piped());
	println!("Starting a transcode with the command: {:?}", cmd);
	let mut child = cmd.spawn().expect("ffmpeg failed to start");

	let stdout = child.stdout.take().unwrap();
	let (tx, mut rx) = watch::channel(0u32);

	tokio::spawn(async move {
		let mut reader = BufReader::new(stdout).lines();
		while let Some(line) = reader.next_line().await.unwrap() {
			if let Some((key, value)) = line.find('=').map(|i| line.split_at(i)) {
				let value = &value[1..];
				// Can't use ms since ms and us are both set to us /shrug
				if key == "out_time_us" {
					tx.send(value.parse::<u32>().unwrap() / 1_000_000).unwrap();
				}
				// TODO: maybe store speed too.
			}
		}
	});

	// Wait for 1.5 * segment time after start_time to be ready.
	loop {
		rx.changed().await.unwrap();
		let ready_time = *rx.borrow();
		if ready_time >= (1.5 * segment_time as f32) as u32 + start_time {
			break;
		}
	}

	TranscodeInfo {
		show: (path, quality),
		job: child,
		uuid,
		start_time,
		ready_time: rx,
	}
}

fn get_cache_path(info: &TranscodeInfo) -> PathBuf {
	return get_cache_path_from_uuid(&info.uuid);
}

fn get_cache_path_from_uuid(uuid: &String) -> PathBuf {
	return PathBuf::from(format!("/cache/{uuid}/", uuid = &uuid));
}

struct TranscodeInfo {
	show: (String, Quality),
	// TODO: Store if the process as ended (probably Option<Child> for the job)
	job: Child,
	uuid: String,
	#[allow(dead_code)]
	start_time: u32,
	#[allow(dead_code)]
	ready_time: Receiver<u32>,
}

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

		let info = start_transcode(path, quality, start_time).await;
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
