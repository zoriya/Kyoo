use rand::distributions::Alphanumeric;
use rand::{thread_rng, Rng};
use std::process::{Child, Command};
use std::str::FromStr;
use std::{collections::HashMap, sync::Mutex};

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
async fn start_transcode(path: &str, quality: &Quality, start_time_sec: f32) -> (String, Child) {
	// TODO: Use the out path below once cached segments can be reused.
	// let out_dir = format!("/cache/{show_hash}/{quality}");
	let uuid: String = thread_rng()
		.sample_iter(&Alphanumeric)
		.take(30)
		.map(char::from)
		.collect();
	let out_dir = format!("/cache/{uuid}");

	let segment_time = "10";
	let child = Command::new("ffmpeg")
		.args(&["-ss", start_time_sec.to_string().as_str()])
		.args(&["-i", path])
		.args(&["-f", "segment"])
		.args(&["-segment_list_type", "m3u8"])
		// Keep all segments in the list (else only last X are presents, useful for livestreams)
		.args(&["--segment_list_size", "0"])
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
		.args(get_transcode_video_quality_args(quality))
		.args(&[
			"-segment_list".to_string(),
			format!("{out_dir}/stream.m3u8"),
			format!("{out_dir}/segments-%02d.ts"),
		])
		.spawn()
		.expect("ffmpeg failed to start");
	(uuid, child)
}

struct TranscodeInfo {
	show: (String, Quality)
	job: Child
	uuid: String
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
		&mut self,
		client_id: String,
		path: String,
		quality: Quality,
		start_time_sec: f32,
	) {
		// TODO: If the stream is not yet up to start_time (and is far), kill it and restart one at the right time.
		// TODO: Clear cache at startup/every X time without use.
		// TODO: cache transcoded output for a show/quality and reuse it for every future requests.
		if let Some(TranscodeInfo{show: (old_path, old_qual), job, uuid}) = self.running.lock().unwrap().get_mut(&client_id) {
			if path == *old_path && quality != *old_qual {
				job.interrupt();
			}
		}

		let (uuid, job) = start_transcode(&path, &quality, start_time_sec).await;
		self.running.lock().unwrap().insert(client_id, TranscodeInfo { show: (path, quality), job, uuid});
	}
}
