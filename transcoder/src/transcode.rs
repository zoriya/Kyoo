use rand::distributions::Alphanumeric;
use rand::{thread_rng, Rng};
use serde::Serialize;
use std::collections::HashMap;
use std::path::PathBuf;
use std::process::Stdio;
use std::str::FromStr;
use std::sync::RwLock;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::{Child, Command};
use tokio::sync::watch::{self, Receiver};

use crate::utils::Signalable;

#[derive(PartialEq, Eq, Serialize)]
pub enum Quality {
	P240,
	P360,
	P480,
	P720,
	P1080,
	P1440,
	P4k,
	P8k,
	Original,
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

fn get_transcode_video_quality_args(quality: &Quality) -> Vec<&'static str> {
	// superfast or ultrafast would produce a file extremly big so we prever veryfast.
	let enc_base: Vec<&str> = vec![
		"-map", "0:v:0", "-c:v", "libx264", "-crf", "21", "-preset", "veryfast",
	];

	match quality {
		Quality::Original => vec![],
		Quality::P240 => [enc_base, vec!["-vf", "scale=-2:'min(240,ih)'"]].concat(),
		Quality::P360 => [enc_base, vec!["-vf", "scale=-2:'min(360,ih)'"]].concat(),
		Quality::P480 => [enc_base, vec!["-vf", "scale=-2:'min(480,ih)'"]].concat(),
		Quality::P720 => [enc_base, vec!["-vf", "scale=-2:'min(720,ih)'"]].concat(),
		Quality::P1080 => [enc_base, vec!["-vf", "scale=-2:'min(1080,ih)'"]].concat(),
		Quality::P1440 => [enc_base, vec!["-vf", "scale=-2:'min(1440,ih)'"]].concat(),
		Quality::P4k => [enc_base, vec!["-vf", "scale=-2:'min(2160,ih)'"]].concat(),
		Quality::P8k => [enc_base, vec!["-vf", "scale=-2:'min(4320,ih)'"]].concat(),
	}
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
		.args(&["-hls_allow_cache", "1"])
		// Keep all segments in the list (else only last X are presents, useful for livestreams)
		.args(&["-hls_list_size", "0"])
		.args(&["-hls_time", segment_time.to_string().as_str()])
		// Force segments to be exactly segment_time (only works when transcoding)
		.args(&[
			"-force_key_frames",
			format!("expr:gte(t,n_forced*{segment_time})").as_str(),
			"-strict",
			"-2",
			"-segment_time_delta",
			"0.1",
		])
		.args(get_transcode_video_quality_args(&quality))
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
