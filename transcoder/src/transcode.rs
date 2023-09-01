use derive_more::Display;
use rand::distributions::Alphanumeric;
use rand::{thread_rng, Rng};
use serde::Serialize;
use utoipa::ToSchema;
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::path::PathBuf;
use std::process::Stdio;
use std::slice::Iter;
use std::str::FromStr;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::{Child, Command};
use tokio::sync::watch;

const SEGMENT_TIME: u32 = 10;

pub enum TranscodeError {
	ReadError(std::io::Error),
	FFmpegError(String),
	ArgumentError(String),
}

#[derive(PartialEq, Eq, Serialize, Display, Clone, Copy, ToSchema)]
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
	pub fn iter() -> Iter<'static, Quality> {
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

	pub fn height(&self) -> u32 {
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
	pub fn average_bitrate(&self) -> u32 {
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

	pub fn max_bitrate(&self) -> u32 {
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

	pub fn from_height(height: u32) -> Self {
		Self::iter()
			.find(|x| x.height() >= height)
			.unwrap_or(&Quality::P240)
			.clone()
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

fn get_transcode_audio_args(audio_idx: u32) -> Vec<String> {
	// TODO: Support multi audio qualities.
	return vec![
		"-map".to_string(),
		format!("0:a:{}", audio_idx),
		"-c:a".to_string(),
		"aac".to_string(),
		// TODO: Support 5.1 audio streams.
		"-ac".to_string(),
		"2".to_string(),
		"-b:a".to_string(),
		"128k".to_string(),
	];
}

fn get_transcode_video_quality_args(quality: &Quality, segment_time: u32) -> Vec<String> {
	if *quality == Quality::Original {
		return vec!["-map", "0:V:0", "-c:v", "copy"]
			.iter()
			.map(|a| a.to_string())
			.collect();
	}
	vec![
		// superfast or ultrafast would produce a file extremly big so we prever veryfast.
		vec![
			"-map", "0:V:0", "-c:v", "libx264", "-crf", "21", "-preset", "veryfast",
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

pub async fn transcode_audio(path: String, audio: u32) -> Result<Child, TranscodeError> {
	start_transcode(
		&path,
		&get_audio_path(&path, audio),
		get_transcode_audio_args(audio),
		0,
	)
	.await
	.map_err(|e| {
		if let TranscodeError::FFmpegError(message) = e {
			if message.contains("matches no streams.") {
				return TranscodeError::ArgumentError("Invalid audio index".to_string());
			}
			return TranscodeError::FFmpegError(message);
		}
		e
	})
}

pub async fn transcode_video(
	path: String,
	quality: Quality,
	start_time: u32,
) -> Result<TranscodeInfo, TranscodeError> {
	// TODO: Use the out path below once cached segments can be reused.
	// let out_dir = format!("/cache/{show_hash}/{quality}");
	let uuid: String = thread_rng()
		.sample_iter(&Alphanumeric)
		.take(30)
		.map(char::from)
		.collect();
	let out_dir = format!("/cache/{uuid}");

	let child = start_transcode(
		&path,
		&out_dir,
		get_transcode_video_quality_args(&quality, SEGMENT_TIME),
		start_time,
	)
	.await?;
	Ok(TranscodeInfo {
		show: (path, quality),
		job: child,
		uuid,
	})
}

async fn start_transcode(
	path: &String,
	out_dir: &String,
	encode_args: Vec<String>,
	start_time: u32,
) -> Result<Child, TranscodeError> {
	std::fs::create_dir_all(&out_dir).expect("Could not create cache directory");

	let mut cmd = Command::new("ffmpeg");
	cmd.args(&["-progress", "pipe:1"])
		.args(&["-nostats", "-hide_banner", "-loglevel", "warning"])
		.args(&["-ss", start_time.to_string().as_str()])
		.args(&["-i", path.as_str()])
		.args(&["-f", "hls"])
		// Use a .tmp file for segments (.ts files)
		.args(&["-hls_flags", "temp_file"])
		// Cache can't be allowed since switching quality means starting a new encode for now.
		.args(&["-hls_allow_cache", "1"])
		// Keep all segments in the list (else only last X are presents, useful for livestreams)
		.args(&["-hls_list_size", "0"])
		.args(&["-hls_time", SEGMENT_TIME.to_string().as_str()])
		.args(&encode_args)
		.args(&[
			"-hls_segment_filename".to_string(),
			format!("{out_dir}/segments-%02d.ts"),
			format!("{out_dir}/stream.m3u8"),
		])
		.stdout(Stdio::piped())
		.stderr(Stdio::piped());
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
					// Sometimes, the value is invalid (or negative), default to 0 in those cases
					let _ = tx.send(value.parse::<u32>().unwrap_or(0) / 1_000_000);
				}
			}
		}
	});

	loop {
		// rx.changed() returns an error if the sender is dropped aka if the coroutine 10 lines
		// higher has finished aka if the process has finished.
		if let Err(_) = rx.changed().await {
			let es = child.wait().await.unwrap();
			if es.success() {
				return Ok(child);
			}
			let output = child.wait_with_output().await.unwrap();
			return Err(TranscodeError::FFmpegError(
				String::from_utf8(output.stderr).unwrap(),
			));
		}

		// Wait for 1.5 * segment time after start_time to be ready.
		let ready_time = *rx.borrow();
		if ready_time >= (1.5 * SEGMENT_TIME as f32) as u32 + start_time {
			return Ok(child);
		}
	}
}

pub fn get_audio_path(path: &String, audio: u32) -> String {
	let mut hasher = DefaultHasher::new();
	path.hash(&mut hasher);
	audio.hash(&mut hasher);
	let hash = hasher.finish();
	format!("/cache/{hash:x}")
}

pub fn get_cache_path(info: &TranscodeInfo) -> PathBuf {
	return get_cache_path_from_uuid(&info.uuid);
}

pub fn get_cache_path_from_uuid(uuid: &String) -> PathBuf {
	return PathBuf::from(format!("/cache/{uuid}/", uuid = &uuid));
}

pub struct TranscodeInfo {
	pub show: (String, Quality),
	pub job: Child,
	pub uuid: String,
}
