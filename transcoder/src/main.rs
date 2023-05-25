use actix_files::NamedFile;
use actix_web::{
	get,
	web::{self, Json},
	App, HttpServer, Result,
};
use error::ApiError;
use utoipa::OpenApi;

use crate::{
	audio::*,
	identify::{identify, Chapter, MediaInfo, Track},
	state::Transcoder,
	video::*,
};
mod audio;
mod error;
mod identify;
mod paths;
mod state;
mod transcode;
mod utils;
mod video;

/// Direct video
///
/// Retrieve the raw video stream, in the same container as the one on the server. No transcoding or
/// transmuxing is done.
#[utoipa::path(
	responses(
		(status = 200, description = "The item is returned"),
		(status = NOT_FOUND, description = "Invalid slug.")
	),
	params(
		("resource" = String, Path, description = "Episode or movie"),
		("slug" = String, Path, description = "The slug of the movie/episode."),
	)
)]
#[get("/{resource}/{slug}/direct")]
async fn get_direct(query: web::Path<(String, String)>) -> Result<NamedFile> {
	let (resource, slug) = query.into_inner();
	let path = paths::get_path(resource, slug).await.map_err(|e| {
		eprintln!("Unhandled error occured while getting the path: {}", e);
		ApiError::NotFound
	})?;

	Ok(NamedFile::open_async(path).await?)
}

/// Get master playlist
///
/// Get a master playlist containing all possible video qualities and audios available for this resource.
/// Note that the direct stream is missing (since the direct is not an hls stream) and
/// subtitles/fonts are not included to support more codecs than just webvtt.
#[utoipa::path(
	responses(
		(status = 200, description = "Get the m3u8 master playlist."),
		(status = NOT_FOUND, description = "Invalid slug.")
	),
	params(
		("resource" = String, Path, description = "Episode or movie"),
		("slug" = String, Path, description = "The slug of the movie/episode."),
	)
)]
#[get("/{resource}/{slug}/master.m3u8")]
async fn get_master(
	query: web::Path<(String, String)>,
	transcoder: web::Data<Transcoder>,
) -> Result<String, ApiError> {
	let (resource, slug) = query.into_inner();
	Ok(transcoder.build_master(resource, slug).await)
}

/// Identify
///
/// Identify metadata about a file
#[utoipa::path(
	responses(
		(status = 200, description = "Ok", body = MediaInfo),
		(status = NOT_FOUND, description = "Invalid slug.")
	),
	params(
		("resource" = String, Path, description = "Episode or movie"),
		("slug" = String, Path, description = "The slug of the movie/episode."),
	)
)]
#[get("/{resource}/{slug}/identify")]
async fn identify_resource(
	query: web::Path<(String, String)>,
) -> Result<Json<MediaInfo>, ApiError> {
	let (resource, slug) = query.into_inner();
	let path = paths::get_path(resource, slug)
		.await
		.map_err(|_| ApiError::NotFound)?;

	identify(path).await.map(|info| Json(info)).map_err(|e| {
		eprintln!("Unhandled error occured while identifing the resource: {}", e);
		ApiError::InternalError
	})
}

#[get("/openapi.json")]
async fn get_swagger() -> String {
	#[derive(OpenApi)]
	#[openapi(
		info(description = "Transcoder's open api."),
		paths(
			get_direct,
			get_master,
			get_transcoded,
			get_chunk,
			get_audio_transcoded,
			get_audio_chunk,
			identify_resource
		),
		components(schemas(MediaInfo, Track, Chapter))
	)]
	struct ApiDoc;

	ApiDoc::openapi().to_pretty_json().unwrap()
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
	let state = web::Data::new(Transcoder::new());

	HttpServer::new(move || {
		App::new()
			.app_data(state.clone())
			.service(get_direct)
			.service(get_master)
			.service(get_transcoded)
			.service(get_chunk)
			.service(get_audio_transcoded)
			.service(get_audio_chunk)
			.service(identify_resource)
			.service(get_swagger)
	})
	.bind(("0.0.0.0", 7666))?
	.run()
	.await
}
