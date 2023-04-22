use serde::Serialize;

#[derive(Serialize)]
pub struct MediaInfo {

}

pub fn identify(path: String) -> Result<MediaInfo, std::io::Error> {
	todo!()
}
