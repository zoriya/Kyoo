use std::path::PathBuf;

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
	identify::{identify, Chapter, MediaInfo, Video, Audio, Subtitle},
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
async fn get_direct(query: web::Path<(String, String)>) -> Result<NamedFile, ApiError> {
	let (resource, slug) = query.into_inner();
	let path = paths::get_path(resource, slug).await.map_err(|e| {
		eprintln!("Unhandled error occured while getting the path: {}", e);
		ApiError::NotFound
	})?;

	NamedFile::open_async(path).await.map_err(|e| {
		eprintln!(
			"Unhandled error occured while openning the direct stream: {}",
			e
		);
		ApiError::InternalError
	})
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
	transcoder
		.build_master(resource, slug)
		.await
		.ok_or(ApiError::InternalError)
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
#[get("/{resource}/{slug}/info")]
async fn identify_resource(
	query: web::Path<(String, String)>,
) -> Result<Json<MediaInfo>, ApiError> {
	let (resource, slug) = query.into_inner();
	let path = paths::get_path(resource, slug)
		.await
		.map_err(|_| ApiError::NotFound)?;

	identify(path)
		.await
		.map(|info| Json(info))
		.map_err(|e| {
			eprintln!(
				"Unhandled error occured while identifing the resource: {}",
				e
			);
			ApiError::InternalError
		})
}

/// Get attachments
///
/// Get a specific attachment
#[utoipa::path(
	responses(
		(status = 200, description = "Ok", body = MediaInfo),
		(status = NOT_FOUND, description = "Invalid slug.")
	),
	params(
		("sha" = String, Path, description = "The sha1 of the file"),
		("name" = String, Path, description = "The name of the attachment."),
	)
)]
#[get("/{sha}/attachment/{name}")]
async fn get_attachment(query: web::Path<(String, String)>) -> Result<NamedFile, ApiError> {
	let (sha, name) = query.into_inner();
	let mut attpath = PathBuf::from("/metadata");
	attpath.push(sha);
	attpath.push("att");
	attpath.push(name);
	NamedFile::open_async(attpath)
		.await
		.map_err(|_| ApiError::NotFound)
}

/// Get subtitle
///
/// Get a specific subtitle
#[utoipa::path(
	responses(
		(status = 200, description = "Ok", body = MediaInfo),
		(status = NOT_FOUND, description = "Invalid slug.")
	),
	params(
		("sha" = String, Path, description = "The sha1 of the file"),
		("name" = String, Path, description = "The name of the subtitle."),
	)
)]
#[get("/{sha}/subtitle/{name}")]
async fn get_subtitle(query: web::Path<(String, String)>) -> Result<NamedFile, ApiError> {
	let (sha, name) = query.into_inner();
	let mut subpath = PathBuf::from("/metadata");
	subpath.push(sha);
	subpath.push("sub");
	subpath.push(name);
	NamedFile::open_async(subpath)
		.await
		.map_err(|_| ApiError::NotFound)
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
			identify_resource,
			get_attachment,
			get_subtitle,
		),
		components(schemas(MediaInfo, Video, Audio, Subtitle, Chapter))
	)]
	struct ApiDoc;

	ApiDoc::openapi().to_pretty_json().unwrap()
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
	let state = web::Data::new(Transcoder::new());

	// Clear the cache
	for entry in std::fs::read_dir("/cache")? {
		_ = std::fs::remove_dir_all(entry?.path());
	}

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
			.service(get_attachment)
			.service(get_subtitle)
	})
	.bind(("0.0.0.0", 7666))?
	.run()
	.await
}
