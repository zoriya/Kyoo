use rand::distributions::Alphanumeric;
use rand::{thread_rng, Rng};
use std::process::Stdio;
use std::str::FromStr;
use std::sync::atomic::AtomicI32;
use std::sync::Arc;
use std::{collections::HashMap, sync::Mutex};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::{Child, Command};

use crate::utils::Signalable;

#[derive(PartialEq, Eq)]
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
		Quality::P240 => [enc_base, vec!["-vf", "scale=-1:240"]].concat(),
		Quality::P360 => [enc_base, vec!["-vf", "scale=-1:360"]].concat(),
		Quality::P480 => [enc_base, vec!["-vf", "scale=-1:480"]].concat(),
		Quality::P720 => [enc_base, vec!["-vf", "scale=-1:720"]].concat(),
		Quality::P1080 => [enc_base, vec!["-vf", "scale=-1:1080"]].concat(),
		Quality::P1440 => [enc_base, vec!["-vf", "scale=-1:1440"]].concat(),
		Quality::P4k => [enc_base, vec!["-vf", "scale=-1:2160"]].concat(),
		Quality::P8k => [enc_base, vec!["-vf", "scale=-1:4320"]].concat(),
	}
}

// TODO: Add audios streams (and transcode them only when necesarry)
async fn start_transcode(path: String, quality: Quality, start_time: i32) -> TranscodeInfo {
	// TODO: Use the out path below once cached segments can be reused.
	// let out_dir = format!("/cache/{show_hash}/{quality}");
	let uuid: String = thread_rng()
		.sample_iter(&Alphanumeric)
		.take(30)
		.map(char::from)
		.collect();
	let out_dir = format!("/cache/{uuid}");
	std::fs::create_dir(&out_dir).expect("Could not create cache directory");

	let segment_time = "10";
	let mut child = Command::new("ffmpeg")
		.args(&["-progress", "pipe:1"])
		.args(&["-ss", start_time.to_string().as_str()])
		.args(&["-i", path.as_str()])
		.args(&["-f", "segment"])
		.args(&["-segment_list_type", "m3u8"])
		// Disable the .tmp file to serve it instantly to the client.
		.args(&["-hls_flags", "temp_files"])
		// Keep all segments in the list (else only last X are presents, useful for livestreams)
		.args(&["-segment_list_size", "0"])
		.args(&["-segment_time", segment_time])
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
			"-segment_list".to_string(),
			format!("{out_dir}/stream.m3u8"),
			format!("{out_dir}/segments-%02d.ts"),
		])
		.stdout(Stdio::piped())
		.spawn()
		.expect("ffmpeg failed to start");

	let stdout = child.stdout.take().unwrap();
	let info = TranscodeInfo {
		show: (path, quality),
		job: child,
		uuid,
		start_time,
		ready_time: Arc::new(AtomicI32::new(0)),
	};
	let ready_time = Arc::clone(&info.ready_time);

	tokio::spawn(async move {
		let mut reader = BufReader::new(stdout).lines();
		while let Some(line) = reader.next_line().await.unwrap() {
			if let Some((key, value)) = line.find(':').map(|i| line.split_at(i)) {
				if key == "out_time_ms" {
					ready_time.store(
						value.parse::<i32>().unwrap() / 1000,
						std::sync::atomic::Ordering::Relaxed,
					);
				}
				// TODO: maybe store speed too.
			}
		}
	});

	// TODO: Wait for 1.5 * segment time after start_time to be ready.
	return info;
}

struct TranscodeInfo {
	show: (String, Quality),
	// TODO: Store if the process as ended (probably Option<Child> for the job)
	job: Child,
	uuid: String,
	#[allow(dead_code)]
	start_time: i32,
	ready_time: Arc<AtomicI32>,
}

pub struct Transcoder {
	running: Mutex<HashMap<String, TranscodeInfo>>,
}

impl Transcoder {
	pub fn new() -> Transcoder {
		Self {
			running: Mutex::new(HashMap::new()),
		}
	}

	pub async fn transcode(
		&self,
		client_id: String,
		path: String,
		quality: Quality,
		start_time: i32,
	) -> Result<String, std::io::Error> {
		// TODO: If the stream is not yet up to start_time (and is far), kill it and restart one at the right time.
		// TODO: Clear cache at startup/every X time without use.
		// TODO: cache transcoded output for a show/quality and reuse it for every future requests.
		if let Some(TranscodeInfo {
			show: (old_path, old_qual),
			job,
			uuid,
			..
		}) = self.running.lock().unwrap().get_mut(&client_id)
		{
			if path != *old_path || quality != *old_qual {
				job.interrupt()?;
			} else {
				let path = format!("/cache/{uuid}/stream.m3u8", uuid = &uuid);
				return std::fs::read_to_string(path);
			}
		}

		let info = start_transcode(path, quality, start_time).await;
		let path = format!("/cache/{uuid}/stream.m3u8", uuid = &info.uuid);
		self.running.lock().unwrap().insert(client_id, info);
		std::fs::read_to_string(path)
	}
}
