use crate::{error::ApiError, paths, state::Transcoder};
use actix_files::NamedFile;
use actix_web::{get, web, Result};

/// Transcode audio
///
/// Get the selected audio
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
		("audio" = u32, Path, description = "Specify the audio stream you want. For mappings, refer to the audios fields of the /watch response."),
	)
)]
#[get("/{resource}/{slug}/audio/{audio}/index.m3u8")]
async fn get_audio_transcoded(
	query: web::Path<(String, String, u32)>,
	transcoder: web::Data<Transcoder>,
) -> Result<String, ApiError> {
	let (resource, slug, audio) = query.into_inner();
	let path = paths::get_path(resource, slug)
		.await
		.map_err(|_| ApiError::NotFound)?;

	transcoder.transcode_audio(path, audio).await.map_err(|e| {
		eprintln!("Error while transcoding audio: {}", e);
		ApiError::InternalError
	})
}

/// Get audio chunk
///
/// Retrieve a chunk of a transcoded audio.
#[utoipa::path(
	responses(
		(status = 200, description = "Get a hls chunk."),
		(status = NOT_FOUND, description = "Invalid slug.")
	),
	params(
		("resource" = String, Path, description = "Episode or movie"),
		("slug" = String, Path, description = "The slug of the movie/episode."),
		("audio" = u32, Path, description = "Specify the audio you want"),
		("chunk" = u32, Path, description = "The number of the chunk"),
	)
)]
#[get("/{resource}/{slug}/audio/{audio}/segments-{chunk}.ts")]
async fn get_audio_chunk(
	query: web::Path<(String, String, u32, u32)>,
	transcoder: web::Data<Transcoder>,
) -> Result<NamedFile, ApiError> {
	let (resource, slug, audio, chunk) = query.into_inner();
	let path = paths::get_path(resource, slug)
		.await
		.map_err(|_| ApiError::NotFound)?;

	transcoder
		.get_audio_segment(path, audio, chunk)
		.await
		.map_err(|_| ApiError::BadRequest {
			error: "No transcode started for the selected show/audio.".to_string(),
		})
		.and_then(|path| {
			NamedFile::open(path).map_err(|_| ApiError::BadRequest {
				error: "Invalid segment number.".to_string(),
			})
		})
}
