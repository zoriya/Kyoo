use std::pin::Pin;
use std::task::{Context, Poll};

use actix_web::{get, App, HttpResponse, HttpServer, Responder};
use tokio::io::{AsyncRead, AsyncReadExt, ReadBuf};
use futures::Stream;
use pin_project::pin_project;
use tokio::fs::File;
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

impl Stream for FileStream {
	type Item = Result<actix_web::web::Bytes, actix_web::Error>;

	fn poll_next(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {
		let this = self.project();
		tokio::select! {
			exit = self.process.wait(), if !self.done => {
				match exit.unwrap().success() {
					true => {
						self.done = true;
					},
					false => {
						let output = child.wait_with_output().await.unwrap();
						Poll::Ready(Some(Err(String::from_utf8(output.stderr).unwrap())))
					}
				}
			}
			// timeout
		};

		let mut buf = ReadBuf::new(&mut [0; 1024]);
		let ret = match this.file.poll_read(cx, &mut buf) {
			Poll::Ready(_) if buf.filled().len() == self.old_filled && self.done => Poll::Ready(None),
			Poll::Ready(_) if buf.filled().len() == self.old_filled => Poll::Pending,
			Poll::Ready(_) => Poll::Ready(Some(Ok(buf.filled().into()))),
			Poll::Pending => Poll::Pending,
		};
		this.old_filled = buf.filled().len();
		ret
	}
}
