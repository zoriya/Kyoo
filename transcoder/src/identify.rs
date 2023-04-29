use serde::Serialize;
use utoipa::ToSchema;

use crate::transcode::Quality;

#[derive(Serialize, ToSchema)]
pub struct MediaInfo {
	/// The length of the media in seconds.
	length: f32,
	container: String,
	video: VideoTrack,
	audios: Vec<Track>,
	subtitles: Vec<Track>,
	fonts: Vec<String>,
	chapters: Vec<Chapter>,
}

#[derive(Serialize, ToSchema)]
pub struct VideoTrack {
	/// The codec of this stream (defined as the RFC 6381).
	codec: String,
	/// The language of this stream (as a ISO-639-2 language code)
	language: String,
	/// The max quality of this video track.
	quality: Quality,
	/// The width of the video stream
	width: u32,
	/// The height of the video stream
	height: u32,
	/// The average bitrate of the video in bytes/s
	average_bitrate: u32,
	// TODO: Figure out if this is doable
	/// The max bitrate of the video in bytes/s
	max_bitrate: u32,
}

#[derive(Serialize, ToSchema)]
pub struct Track {
	/// The index of this track on the media.
	index: u32,
	/// The title of the stream.
	title: String,
	/// The language of this stream (as a ISO-639-2 language code)
	language: String,
	/// The codec of this stream.
	codec: String,
	/// Is this stream the default one of it's type?
	default: bool,
	/// Is this stream tagged as forced? (useful only for subtitles)
	forced: bool,
}

#[derive(Serialize, ToSchema)]
pub struct Chapter {
	/// The start time of the chapter (in second from the start of the episode).
	start: f32,
	/// The end time of the chapter (in second from the start of the episode).
	end: f32,
	/// The name of this chapter. This should be a human-readable name that could be presented to the user.
	name: String, // TODO: add a type field for Opening, Credits...
}

pub fn identify(_path: String) -> Result<MediaInfo, std::io::Error> {
	todo!()
}
