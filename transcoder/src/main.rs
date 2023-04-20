use std::str::FromStr;

use actix_files::NamedFile;
use actix_web::{get, web, App, HttpRequest, HttpServer, Result};
use error::ApiError;

use crate::transcode::{Quality, Transcoder};
mod error;
mod paths;
mod transcode;
mod utils;

fn get_client_id(req: HttpRequest) -> Result<String, ApiError> {
	req.headers().get("x-client-id")
		.ok_or(ApiError::BadRequest { error: String::from("Missing client id. Please specify the X-CLIENT-ID header to a guid constant for the lifetime of the player (but unique per instance)."), })
		.map(|x| x.to_str().unwrap().to_string())
}

#[get("/movie/direct/{slug}")]
async fn get_movie_direct(query: web::Path<String>) -> Result<NamedFile> {
	let slug = query.into_inner();
	let path = paths::get_movie_path(slug)
		.await
		.map_err(|_| ApiError::NotFound)?;

	Ok(NamedFile::open_async(path).await?)
}

#[get("/movie/{quality}/{slug}/index.m3u8")]
async fn transcode_movie(
	req: HttpRequest,
	query: web::Path<(String, String)>,
	transcoder: web::Data<Transcoder>,
) -> Result<String, ApiError> {
	let (quality, slug) = query.into_inner();
	let quality = Quality::from_str(quality.as_str()).map_err(|_| ApiError::BadRequest {
		error: "Invalid quality".to_string(),
	})?;
	let client_id = get_client_id(req)?;

	let path = paths::get_movie_path(slug)
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

#[get("/movie/{quality}/{slug}/segments-{chunk}.ts")]
async fn get_movie_chunk(
	req: HttpRequest,
	query: web::Path<(String, String, u32)>,
	transcoder: web::Data<Transcoder>,
) -> Result<NamedFile, ApiError> {
	let (quality, slug, chunk) = query.into_inner();
	let quality = Quality::from_str(quality.as_str()).map_err(|_| ApiError::BadRequest {
		error: "Invalid quality".to_string(),
	})?;
	let client_id = get_client_id(req)?;

	let path = paths::get_movie_path(slug)
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

#[actix_web::main]
async fn main() -> std::io::Result<()> {
	let state = web::Data::new(Transcoder::new());

	HttpServer::new(move || {
		App::new()
			.app_data(state.clone())
			.service(get_movie_direct)
			.service(transcode_movie)
			.service(get_movie_chunk)
	})
	.bind(("0.0.0.0", 7666))?
	.run()
	.await
}
