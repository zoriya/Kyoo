use json::JsonValue;
use serde::Serialize;
use std::str::{self, FromStr};
use tokio::process::Command;
use utoipa::ToSchema;

use crate::transcode::Quality;

#[derive(Serialize, ToSchema)]
pub struct MediaInfo {
	/// The length of the media in seconds.
	pub length: f32,
	pub container: String,
	pub video: VideoTrack,
	pub audios: Vec<Track>,
	pub subtitles: Vec<Track>,
	pub fonts: Vec<String>,
	pub chapters: Vec<Chapter>,
}

#[derive(Serialize, ToSchema)]
pub struct VideoTrack {
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
pub struct Track {
	/// The index of this track on the media.
	pub index: u32,
	/// The title of the stream.
	pub title: Option<String>,
	/// The language of this stream (as a ISO-639-2 language code)
	pub language: Option<String>,
	/// The codec of this stream.
	pub codec: String,
	/// Is this stream the default one of it's type?
	pub default: bool,
	/// Is this stream tagged as forced? (useful only for subtitles)
	pub forced: bool,
}

#[derive(Serialize, ToSchema)]
pub struct Chapter {
	/// The start time of the chapter (in second from the start of the episode).
	pub start: f32,
	/// The end time of the chapter (in second from the start of the episode).
	pub end: f32,
	/// The name of this chapter. This should be a human-readable name that could be presented to the user.
	pub name: String, // TODO: add a type field for Opening, Credits...
}

pub async fn identify(path: String) -> Result<MediaInfo, std::io::Error> {
	let mediainfo = Command::new("mediainfo")
		.arg("--Output=JSON")
		.arg("--Language=raw")
		.arg(path)
		.output()
		.await
		.expect("Error running the mediainfo command");
	assert!(mediainfo.status.success());
	let output = json::parse(str::from_utf8(mediainfo.stdout.as_slice()).unwrap()).unwrap();

	let general = output["media"]["track"]
		.members()
		.find(|x| x["@type"] == "General")
		.unwrap();

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
			VideoTrack {
				// This codec is not in the right format (does not include bitdepth...).
				codec: v["Format"].as_str().unwrap().to_string(),
				language: v["Language"].as_str().map(|x| x.to_string()),
				quality: Quality::from_height(parse::<u32>(&v["Height"]).unwrap()),
				width: parse::<u32>(&v["Width"]).unwrap(),
				height: parse::<u32>(&v["Height"]).unwrap(),
				bitrate: parse::<u32>(&v["BitRate"]).unwrap(),
			}
		},
		audios: output["media"]["track"]
			.members()
			.filter(|x| x["@type"] == "Audio")
			.map(|a| Track {
				index: parse::<u32>(&a["StreamOrder"]).unwrap() - 1,
				title: a["Title"].as_str().map(|x| x.to_string()),
				language: a["Language"].as_str().map(|x| x.to_string()),
				// TODO: format is invalid. Channels count missing...
				codec: a["Format"].as_str().unwrap().to_string(),
				default: a["Default"] == "Yes",
				forced: a["Forced"] == "No",
			})
			.collect(),
		subtitles: output["media"]["track"]
			.members()
			.filter(|x| x["@type"] == "Text")
			.map(|a| Track {
				index: parse::<u32>(&a["StreamOrder"]).unwrap() - 1,
				title: a["Title"].as_str().map(|x| x.to_string()),
				language: a["Language"].as_str().map(|x| x.to_string()),
				// TODO: format is invalid. Channels count missing...
				codec: a["Format"].as_str().unwrap().to_string(),
				default: a["Default"] == "Yes",
				forced: a["Forced"] == "No",
			})
			.collect(),
		fonts: vec![],
		chapters: output["media"]["track"]
			.members()
			.find(|x| x["@type"] == "Menu")
			.map(|x| {
				std::iter::zip(x["extra"].entries(), x["extra"].entries().skip(1))
					.map(|((start, name), (end, _))| Chapter {
						start: time_to_seconds(start),
						end: time_to_seconds(end),
						name: name.as_str().unwrap().to_string(),
					})
					.collect()
			})
			.unwrap_or(vec![]),
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
