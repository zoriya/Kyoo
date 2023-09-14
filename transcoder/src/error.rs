use actix_web::{
	error,
	http::{header::ContentType, StatusCode},
	HttpResponse,
};
use derive_more::{Display, Error};

#[derive(Debug, Display, Error)]
pub enum ApiError {
	#[display(fmt = "{}", error)]
	BadRequest { error: String },
	#[display(fmt = "Resource not found.")]
	NotFound,
	#[display(fmt = "An internal error occurred. Please try again later.")]
	InternalError,
}

impl error::ResponseError for ApiError {
	fn error_response(&self) -> HttpResponse {
		HttpResponse::build(self.status_code())
			.insert_header(ContentType::json())
			.body(format!(
				"{{ \"status\": \"{status}\", \"errors\": [\"{err}\"] }}",
				status = self.status_code(),
				err = self.to_string()
			))
	}

	fn status_code(&self) -> StatusCode {
		match self {
			ApiError::BadRequest { error: _ } => StatusCode::BAD_REQUEST,
			ApiError::NotFound => StatusCode::NOT_FOUND,
			ApiError::InternalError => StatusCode::INTERNAL_SERVER_ERROR,
		}
	}
}
