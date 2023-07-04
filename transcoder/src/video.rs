use std::str::FromStr;

use crate::{error::ApiError, paths, state::Transcoder, transcode::{Quality, TranscodeError}, utils::get_client_id};
use actix_files::NamedFile;
use actix_web::{get, web, HttpRequest, Result};

/// Transcode video
///
/// Transcode the video to the selected quality.
/// This route can take a few seconds to respond since it will way for at least one segment to be
/// available.
#[utoipa::path(
	responses(
		(status = 200, description = "Get the m3u8 playlist."),
		(status = NOT_FOUND, description = "Invalid slug.")
	),
	params(
		("resource" = String, Path, description = "Episode or movie"),
		("slug" = String, Path, description = "The slug of the movie/episode."),
		("quality" = Quality, Path, description = "Specify the quality you want"),
		("x-client-id" = String, Header, description = "A unique identify for a player's instance. Used to cancel unused transcode"),
	)
)]
#[get("/{resource}/{slug}/{quality}/index.m3u8")]
async fn get_transcoded(
	req: HttpRequest,
	query: web::Path<(String, String, String)>,
	transcoder: web::Data<Transcoder>,
) -> Result<String, ApiError> {
	let (resource, slug, quality) = query.into_inner();
	let quality = Quality::from_str(quality.as_str()).map_err(|_| ApiError::BadRequest {
		error: "Invalid quality".to_string(),
	})?;
	let client_id = get_client_id(req)?;

	let path = paths::get_path(resource, slug)
		.await
		.map_err(|_| ApiError::NotFound)?;
	// TODO: Handle start_time that is not 0
	transcoder
		.transcode(client_id, path, quality, 0)
		.await
		.map_err(|e| {
			match e {
				TranscodeError::ArgumentError(err) => ApiError::BadRequest { error: err },
				TranscodeError::FFmpegError(err) => {
					eprintln!("Unhandled ffmpeg error occured while transcoding video: {}", err);
					ApiError::InternalError
				},
				TranscodeError::ReadError(err) => {
					eprintln!("Unhandled read error occured while transcoding video: {}", err);
					ApiError::InternalError
				}
			}
		})
}

/// Get transmuxed chunk
///
/// Retrieve a chunk of a transmuxed video.
#[utoipa::path(
	responses(
		(status = 200, description = "Get a hls chunk."),
		(status = NOT_FOUND, description = "Invalid slug.")
	),
	params(
		("resource" = String, Path, description = "Episode or movie"),
		("slug" = String, Path, description = "The slug of the movie/episode."),
		("quality" = Quality, Path, description = "Specify the quality you want"),
		("chunk" = u32, Path, description = "The number of the chunk"),
		("x-client-id" = String, Header, description = "A unique identify for a player's instance. Used to cancel unused transcode"),
	)
)]
#[get("/{resource}/{slug}/{quality}/segments-{chunk}.ts")]
async fn get_chunk(
	req: HttpRequest,
	query: web::Path<(String, String, String, u32)>,
	transcoder: web::Data<Transcoder>,
) -> Result<NamedFile, ApiError> {
	let (resource, slug, quality, chunk) = query.into_inner();
	let quality = Quality::from_str(quality.as_str()).map_err(|_| ApiError::BadRequest {
		error: "Invalid quality".to_string(),
	})?;
	let client_id = get_client_id(req)?;

	let path = paths::get_path(resource, slug)
		.await
		.map_err(|_| ApiError::NotFound)?;
	// TODO: Handle start_time that is not 0
	transcoder
		.get_segment(client_id, path, quality, chunk)
		.await
		.map_err(|_| ApiError::BadRequest {
			error: "No transcode started for the selected show/quality.".to_string(),
		})
		.and_then(|path| {
			NamedFile::open(path).map_err(|_| ApiError::BadRequest {
				error: "Invalid segment number.".to_string(),
			})
		})
}
