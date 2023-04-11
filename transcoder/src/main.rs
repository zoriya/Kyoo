use std::str::FromStr;

use actix_files::NamedFile;
use actix_web::{get, web, App, HttpRequest, HttpServer, Result};
use error::ApiError;

use crate::transcode::{Quality, Transcoder};
mod error;
mod paths;
mod transcode;
mod utils;

#[get("/movie/direct/{slug}")]
async fn get_movie_direct(query: web::Path<String>) -> Result<NamedFile> {
	let slug = query.into_inner();
	let path = paths::get_movie_path(slug);

	Ok(NamedFile::open_async(path).await?)
}

#[get("/movie/{quality}/{slug}/master.m3u8")]
async fn get_movie_auto(
	req: HttpRequest,
	query: web::Path<(String, String)>,
	transcoder: web::Data<Transcoder>,
) -> Result<NamedFile, ApiError> {
	let (quality, slug) = query.into_inner();
	let quality = Quality::from_str(quality.as_str()).map_err(|_| ApiError::BadRequest {
		error: "Invalid quality".to_string(),
	})?;
	let client_id = req.headers().get("x-client-id")
		.ok_or(ApiError::BadRequest { error: String::from("Missing client id. Please specify the X-CLIENT-ID header to a guid constant for the lifetime of the player (but unique per instance)."), })?;

	let path = paths::get_movie_path(slug);

	todo!()
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
	let state = web::Data::new(Transcoder::new());

	HttpServer::new(move || {
		App::new()
			.app_data(state.clone())
			.service(get_movie_direct)
			.service(get_movie_auto)
	})
	.bind(("0.0.0.0", 7666))?
	.run()
	.await
}
