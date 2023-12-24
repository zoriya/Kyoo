use std::io;
use std::path::PathBuf;
use std::pin::Pin;
use std::task::{Context, Poll};

use actix_web::{get, App, HttpResponse, HttpServer, Responder};
use async_stream::stream;
use futures::Stream;
use pin_project::pin_project;
use tokio::fs::File;
use tokio::io::{AsyncRead, AsyncReadExt, ReadBuf};
use tokio::process::Child;
use tokio::select;

#[derive(Debug)]
#[pin_project]
pub struct FileStream {
	#[pin]
	file: File,
	process: Child,
	done: bool,
	old_filled: usize,
}

pub async fn file_stream(
	path: PathBuf,
	process: Child,
) -> io::Result<impl Stream<Item = Result<actix_web::web::Bytes, actix_web::Error>>> {
	let file = File::open(path).await?;

	stream! {
		let mut done = false;

		tokio::select! {
			exit = process.wait(), if !done => {
				match exit.unwrap().success() {
					true => {
						done = true;
					},
					false => {
						let output = process.wait_with_output().await.unwrap();
						yield return Err(String::from_utf8(output.stderr).unwrap());
					}
				}
			}
			// timeout
		};


		let mut buf = [0; 1024];
		loop {
			match file.read(cx, &mut buf).await {
				Ok(0) if done => yield return,
				Ok(0) => {},
				Ok(n) => yield Ok(buf[0..n].into()),
				Err(e) => yield Err(e),
			};
		};
	}
}

impl Stream for FileStream {
	type Item = Result<actix_web::web::Bytes, actix_web::Error>;

	fn poll_next(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {
		let this = self.project();

		let mut buf = ReadBuf::new(&mut [0; 1024]);
		let ret = match this.file.poll_read(cx, &mut buf) {
			Poll::Ready(_) if buf.filled().len() == self.old_filled && self.done => {
				Poll::Ready(None)
			}
			Poll::Ready(_) if buf.filled().len() == self.old_filled => Poll::Pending,
			Poll::Ready(_) => Poll::Ready(Some(Ok(buf.filled().into()))),
			Poll::Pending => Poll::Pending,
		};
		this.old_filled = buf.filled().len();
		ret
	}
}
