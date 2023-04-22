use std::str::FromStr;

use actix_files::NamedFile;
use actix_web::{
	get,
	web::{self, Json},
	App, HttpRequest, HttpServer, Result,
};
use error::ApiError;

use crate::{
	identify::{identify, MediaInfo},
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

#[get("/{resource}/{slug}/direct{extension}")]
async fn get_direct(query: web::Path<(String, String)>) -> Result<NamedFile> {
	let (resource, slug) = query.into_inner();
	let path = paths::get_path(resource, slug).await.map_err(|e| {
		eprintln!("Unhandled error occured while getting the path: {}", e);
		ApiError::NotFound
	})?;

	Ok(NamedFile::open_async(path).await?)
}

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
	})
	.bind(("0.0.0.0", 7666))?
	.run()
	.await
}
