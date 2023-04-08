use actix_files::NamedFile;
use actix_web::{get, web, App, HttpServer, Result};

use crate::transcode::{Quality, TranscoderState};
mod paths;
mod transcode;

#[get("/movie/direct/{slug}")]
async fn get_movie_direct(query: web::Path<String>) -> Result<NamedFile> {
	let slug = query.into_inner();
	let path = paths::get_movie_path(slug);

	Ok(NamedFile::open_async(path).await?)
}

#[get("/movie/{quality}/{slug}")]
async fn get_movie_auto(
	query: web::Path<(String, String)>,
	state: web::Data<TranscoderState>,
) -> Result<NamedFile> {
	let (quality, slug) = query.into_inner();
	let path = paths::get_movie_path(slug);

	Ok(NamedFile::open_async(path).await?)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
	let state = web::Data::new(TranscoderState::new());

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
