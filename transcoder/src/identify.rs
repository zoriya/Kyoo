use serde::Serialize;
use utoipa::ToSchema;

#[derive(Serialize, ToSchema)]
pub struct MediaInfo {
	container: String,
	video_codec: String,
	audios: Vec<Track>,
	subtitles: Vec<Track>,
	fonts: Vec<String>,
	chapters: Vec<Chapter>,
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
	name: String
	// TODO: add a type field for Opening, Credits...
}

pub fn identify(_path: String) -> Result<MediaInfo, std::io::Error> {
	todo!()
}
