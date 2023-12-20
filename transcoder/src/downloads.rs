use std::str::FromStr;

use actix_web::{get, web, HttpRequest};

use crate::{
	error::ApiError,
	paths,
	state::Transcoder,
	transcode::{Quality, TranscodeError},
};

/// Download item
///
/// Transcode the video/audio to the selected quality for offline use.
/// This route will be slow and stream an incomplete file, this is not meant to be used while
/// streaming.
#[utoipa::path(
	responses(
		(status = 200, description = "Get the transmuxed item."),
		(status = NOT_FOUND, description = "Invalid slug.")
	),
	params(
		("resource" = String, Path, description = "Episode or movie"),
		("slug" = String, Path, description = "The slug of the movie/episode."),
		("quality" = Quality, Path, description = "Specify the quality you want"),
	)
)]
#[get("/{resource}/{slug}/offline")]
async fn get_offline(
	req: HttpRequest,
	query: web::Path<(String, String, String)>,
	transcoder: web::Data<Transcoder>,
) -> Result<String, ApiError> {
	let (resource, slug, quality) = query.into_inner();
	let quality = Quality::from_str(quality.as_str()).map_err(|_| ApiError::BadRequest {
		error: "Invalid quality".to_string(),
	})?;

	let path = paths::get_path(resource, slug)
		.await
		.map_err(|_| ApiError::NotFound)?;
	transcoder
		.download(path, quality)
		.await
		.map_err(|e| match e {
			TranscodeError::ArgumentError(err) => ApiError::BadRequest { error: err },
			TranscodeError::FFmpegError(err) => {
				eprintln!(
					"Unhandled ffmpeg error occured while transcoding video: {}",
					err
				);
				ApiError::InternalError
			}
			TranscodeError::ReadError(err) => {
				eprintln!(
					"Unhandled read error occured while transcoding video: {}",
					err
				);
				ApiError::InternalError
			}
		})
}
