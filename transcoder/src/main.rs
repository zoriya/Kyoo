use std::str::FromStr;

use actix_files::NamedFile;
use actix_web::{
	get,
	web::{self, Json},
	App, HttpRequest, HttpServer, Result,
};
use error::ApiError;
use utoipa::OpenApi;

use crate::{
	identify::{identify, MediaInfo, Track, Chapter},
	transcode::{Quality, Transcoder},
};
mod error;
mod identify;
mod paths;
mod transcode;
mod utils;

fn get_client_id(req: HttpRequest) -> Result<String, ApiError> {
	req.headers().get("x-client-id")
		.ok_or(ApiError::BadRequest { error: String::from("Missing client id. Please specify the X-CLIENT-ID header to a guid constant for the lifetime of the player (but unique per instance)."), })
		.map(|x| x.to_str().unwrap().to_string())
}

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
			eprintln!("Unhandled error occured while transcoding: {}", e);
			ApiError::InternalError
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

	identify(path).map(|info| Json(info)).map_err(|e| {
		eprintln!("Unhandled error occured while transcoding: {}", e);
		ApiError::InternalError
	})
}

#[get("/openapi.json")]
async fn get_swagger() -> String {
	#[derive(OpenApi)]
	#[openapi(
		info(description = "Transcoder's open api."),
		paths(get_direct, get_transcoded, get_chunk, identify_resource),
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
			.service(get_transcoded)
			.service(get_chunk)
			.service(identify_resource)
			.service(get_swagger)
	})
	.bind(("0.0.0.0", 7666))?
	.run()
	.await
}
