use actix_files::NamedFile;
use actix_web::{get, web, App, HttpServer, Result};
mod paths;

#[get("/movie/direct/{slug}")]
async fn index(query: web::Path<String>) -> Result<NamedFile> {
	let slug = query.into_inner();
	let path = paths::get_movie_path(slug);

	Ok(NamedFile::open_async(path).await?)
		// .map(|f| (infer_content_type(f), f))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
	HttpServer::new(|| App::new().service(index))
		.bind(("0.0.0.0", 7666))?
		.run()
		.await
}
