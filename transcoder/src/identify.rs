use json::JsonValue;
use serde::Serialize;
use sha1::{Digest, Sha1};
use std::{
	fs, io,
	path::PathBuf,
	process::Stdio,
	str::{self, FromStr},
};
use tokio::process::Command;
use utoipa::ToSchema;

use crate::transcode::Quality;

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct MediaInfo {
	/// The sha1 of the video file.
	pub sha: String,
	/// The internal path of the video file.
	pub path: String,
	/// The length of the media in seconds.
	pub length: f32,
	/// The container of the video file of this episode.
	pub container: String,
	pub video: Video,
	pub audios: Vec<Audio>,
	pub subtitles: Vec<Subtitle>,
	pub fonts: Vec<String>,
	pub chapters: Vec<Chapter>,
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct Video {
	/// The codec of this stream (defined as the RFC 6381).
	pub codec: String,
	/// The language of this stream (as a ISO-639-2 language code)
	pub language: Option<String>,
	/// The max quality of this video track.
	pub quality: Quality,
	/// The width of the video stream
	pub width: u32,
	/// The height of the video stream
	pub height: u32,
	/// The average bitrate of the video in bytes/s
	pub bitrate: u32,
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct Audio {
	/// The index of this track on the media.
	pub index: u32,
	/// The title of the stream.
	pub title: Option<String>,
	/// The language of this stream (as a ISO-639-2 language code)
	pub language: Option<String>,
	/// The codec of this stream.
	pub codec: String,
	/// Is this stream the default one of it's type?
	pub is_default: bool,
	/// Is this stream tagged as forced? (useful only for subtitles)
	pub is_forced: bool,
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct Subtitle {
	/// The index of this track on the media.
	pub index: u32,
	/// The title of the stream.
	pub title: Option<String>,
	/// The language of this stream (as a ISO-639-2 language code)
	pub language: Option<String>,
	/// The codec of this stream.
	pub codec: String,
	/// Is this stream the default one of it's type?
	pub is_default: bool,
	/// Is this stream tagged as forced? (useful only for subtitles)
	pub is_forced: bool,
	/// The link to access this subtitle.
	pub link: String,
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct Chapter {
	/// The start time of the chapter (in second from the start of the episode).
	pub start_time: f32,
	/// The end time of the chapter (in second from the start of the episode).
	pub end_time: f32,
	/// The name of this chapter. This should be a human-readable name that could be presented to the user.
	pub name: String, // TODO: add a type field for Opening, Credits...
}

async fn extract(path: String, sha: &String, subs: &Vec<Subtitle>) {
	let mut cmd = Command::new("ffmpeg");
	cmd.current_dir(format!("/metadata/{sha}/att/"))
		.args(&["-dump_attachment:t", ""])
		.args(&["-i", path.as_str()]);
	for sub in subs {
		cmd.args(&[
			"-map",
			format!("0:s:{idx}", idx = sub.index).as_str(),
			"-c:s",
			"copy",
			format!(
				"/metadata/{sha}/sub/{idx}.{ext}",
				idx = sub.index,
				ext = sub.codec
			)
			.as_str(),
		]);
	}
	println!("Starting extraction with the command: {:?}", cmd);
	cmd.stdout(Stdio::null())
		.spawn()
		.expect("Error starting ffmpeg extract")
		.wait()
		.await
		.expect("Error running ffmpeg extract");
}

pub async fn identify(path: String) -> Result<MediaInfo, std::io::Error> {
	let mediainfo = Command::new("mediainfo")
		.arg("--Output=JSON")
		.arg("--Language=raw")
		.arg(path.clone())
		.output()
		.await
		.expect("Error running the mediainfo command");
	assert!(mediainfo.status.success());
	let output = json::parse(str::from_utf8(mediainfo.stdout.as_slice()).unwrap()).unwrap();

	let mut file = fs::File::open(&path)?;
	let mut hasher = Sha1::new();
	io::copy(&mut file, &mut hasher)?;
	let sha = format!("{:x}", hasher.finalize());

	let general = output["media"]["track"]
		.members()
		.find(|x| x["@type"] == "General")
		.unwrap();

	let subs: Vec<Subtitle> = output["media"]["track"]
		.members()
		.filter(|x| x["@type"] == "Text")
		.map(|a| {
			let index = parse::<u32>(&a["@typeorder"]).unwrap() - 1;
			let codec = a["Format"].as_str().unwrap().to_string().to_lowercase();
			Subtitle {
				link: format!("/video/{sha}/subtitle/{index}.{codec}"),
				index,
				title: a["Title"].as_str().map(|x| x.to_string()),
				language: a["Language"].as_str().map(|x| x.to_string()),
				codec,
				is_default: a["Default"] == "Yes",
				is_forced: a["Forced"] == "No",
			}
		})
		.collect();

	if !PathBuf::from(format!("/metadata/{sha}")).exists() {
		std::fs::create_dir_all(format!("/metadata/{sha}/att"))?;
		std::fs::create_dir_all(format!("/metadata/{sha}/sub"))?;
		extract(path.clone(), &sha, &subs).await;
	}

	fn parse<F: FromStr>(v: &JsonValue) -> Option<F> {
		v.as_str().and_then(|x| x.parse::<F>().ok())
	}

	Ok(MediaInfo {
		length: parse::<f32>(&general["Duration"]).unwrap(),
		container: general["Format"].as_str().unwrap().to_string(),
		video: {
			let v = output["media"]["track"]
				.members()
				.find(|x| x["@type"] == "Video")
				.expect("File without video found. This is not supported");
			Video {
				// This codec is not in the right format (does not include bitdepth...).
				codec: v["Format"].as_str().unwrap().to_string(),
				language: v["Language"].as_str().map(|x| x.to_string()),
				quality: Quality::from_height(parse::<u32>(&v["Height"]).unwrap()),
				width: parse::<u32>(&v["Width"]).unwrap(),
				height: parse::<u32>(&v["Height"]).unwrap(),
				bitrate: parse::<u32>(&v["BitRate"])
					.unwrap_or(parse(&general["OverallBitRate"]).unwrap()),
			}
		},
		audios: output["media"]["track"]
			.members()
			.filter(|x| x["@type"] == "Audio")
			.map(|a| Audio {
				index: parse::<u32>(&a["StreamOrder"]).unwrap() - 1,
				title: a["Title"].as_str().map(|x| x.to_string()),
				language: a["Language"].as_str().map(|x| x.to_string()),
				// TODO: format is invalid. Channels count missing...
				codec: a["Format"].as_str().unwrap().to_string(),
				is_default: a["Default"] == "Yes",
				is_forced: a["Forced"] == "No",
			})
			.collect(),
		subtitles: subs,
		fonts: general["extra"]["Attachments"]
			.to_string()
			.split(" / ")
			.map(|x| format!("/video/{sha}/attachment/{x}"))
			.collect(),
		chapters: output["media"]["track"]
			.members()
			.find(|x| x["@type"] == "Menu")
			.map(|x| {
				std::iter::zip(x["extra"].entries(), x["extra"].entries().skip(1))
					.map(|((start, name), (end, _))| Chapter {
						start_time: time_to_seconds(start),
						end_time: time_to_seconds(end),
						name: name.as_str().unwrap().to_string(),
					})
					.collect()
			})
			.unwrap_or(vec![]),
		sha,
		path,
	})
}

fn time_to_seconds(time: &str) -> f32 {
	let splited: Vec<f32> = time
		.split('_')
		.skip(1)
		.map(|x| x.parse().unwrap())
		.collect();
	let hours = splited[0];
	let minutes = splited[1];
	let seconds = splited[2];
	let ms = splited[3];

	(hours * 60. + minutes) * 60. + seconds + ms / 1000.
}
