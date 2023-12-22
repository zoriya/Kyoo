use std::str::FromStr;

use actix_files::NamedFile;
use actix_web::{get, web, HttpResponse};
use serde::Deserialize;

use crate::{
	error::ApiError,
	paths,
	transcode::{transcode_for_offline, Quality},
};

#[derive(Debug, Deserialize)]
struct QualityParam {
	quality: Option<String>,
}

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
	path: web::Path<(String, String)>,
	query: web::Query<QualityParam>,
) -> Result<NamedFile, ApiError> {
	let (resource, slug) = path.into_inner();
	let quality_str = query.into_inner().quality.ok_or(ApiError::BadRequest {
		error: "Quality needs to be specified".to_string(),
	})?;
	let quality = Quality::from_str(quality_str.as_str()).map_err(|_| ApiError::BadRequest {
		error: "Invalid quality".to_string(),
	})?;

	let path = paths::get_path(resource, slug)
		.await
		.map_err(|_| ApiError::NotFound)?;
	if quality == Quality::Original {
		return NamedFile::open_async(path).await.map_err(|e| {
			eprintln!(
				"Unhandled error occured while openning the direct stream: {}",
				e
			);
			ApiError::InternalError
		});
	}
	transcode_for_offline(path, quality)
		.await
		.map_err(|e| {
			eprintln!(
				"Unhandled ffmpeg error occured while transcoding for offline: {}",
				e
			);
			ApiError::InternalError
		})
		.and_then(|path| {
			HttpResponse::Ok().streaming(stream)
		})
}
