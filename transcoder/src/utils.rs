use tokio::{io, process::Child};

extern "C" {
	fn kill(pid: i32, sig: i32) -> i32;
}

/// Signal the process `pid`
fn signal(pid: i32, signal: i32) -> io::Result<()> {
	let ret = unsafe { kill(pid, signal) };
	if ret == 0 {
		Ok(())
	} else {
		Err(io::Error::last_os_error())
	}
}

pub trait Signalable {
	/// Signal the thing
	fn signal(&mut self, signal: i32) -> io::Result<()>;

	/// Send SIGINT
	fn interrupt(&mut self) -> io::Result<()> {
		self.signal(2)
	}
}

impl Signalable for Child {
	fn signal(&mut self, signal: i32) -> io::Result<()> {
		let id = self.id();

		if self.try_wait()?.is_some() || id.is_none() {
			Err(io::Error::new(
				io::ErrorKind::InvalidInput,
				"invalid argument: can't signal an exited process",
			))
		} else {
			crate::utils::signal(id.unwrap() as i32, signal)
		}
	}
}
