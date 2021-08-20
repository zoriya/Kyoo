using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Threading;
using System.Windows.Forms;
using Autofac;
using Kyoo.Models.Options;
using Microsoft.Extensions.Options;

namespace Kyoo.Host.Windows
{
	/// <summary>
	/// A singleton that add an notification icon on the window's toolbar.
	/// </summary>
	public sealed class SystemTrait : IStartable, IDisposable
	{
		/// <summary>
		/// The options containing the <see cref="BasicOptions.PublicUrl"/>.
		/// </summary>
		private readonly IOptions<BasicOptions> _options;
		
		/// <summary>
		/// The thread where the trait is running.
		/// </summary>
		private Thread? _thread;
		
		
		/// <summary>
		/// Create a new <see cref="SystemTrait"/>.
		/// </summary>
		/// <param name="options">The options to use.</param>
		public SystemTrait(IOptions<BasicOptions> options)
		{
			_options = options;
		}
		
		/// <inheritdoc />
		public void Start()
		{
			_thread = new Thread(() => InternalSystemTrait.Run(_options))
			{
				IsBackground = true
			};
			_thread.Start();
		}

		/// <inheritdoc />
		public void Dispose()
		{
			// TODO not sure that the trait is ended and that it does shutdown but the only way to shutdown the
			//      app anyway is via the Trait's Exit or a Signal so it's fine.
			_thread?.Join();
			_thread = null;
		}

		/// <summary>
		/// The internal class for <see cref="SystemTrait"/>. It should be invoked via
		/// <see cref="InternalSystemTrait.Run"/>.
		/// </summary>
		private class InternalSystemTrait : ApplicationContext
		{
			/// <summary>
            /// The options containing the <see cref="BasicOptions.PublicUrl"/>.
            /// </summary>
			private readonly IOptions<BasicOptions> _options;
			
			/// <summary>
			/// The Icon that is displayed in the window's bar. 
			/// </summary>
			private readonly NotifyIcon _icon;

			/// <summary>
			/// Create a new <see cref="InternalSystemTrait"/>. Used only by <see cref="Run"/>.
			/// </summary>
			/// <param name="options">The option containing the public url.</param>
			private InternalSystemTrait(IOptions<BasicOptions> options)
			{
				_options = options;

				AppDomain.CurrentDomain.ProcessExit += (_, _) => Dispose();
				Application.ApplicationExit += (_, _) => Dispose();

				_icon = new NotifyIcon();
				_icon.Text = "Kyoo";
				_icon.Icon = new Icon(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "kyoo.ico"));
				_icon.Visible = true;
				_icon.MouseClick += (_, e) =>
				{
					if (e.Button != MouseButtons.Left)
						return;
					_StartBrowser();
				};

				_icon.ContextMenuStrip = new ContextMenuStrip();
				_icon.ContextMenuStrip.Items.AddRange(new ToolStripItem[]
				{
					new ToolStripMenuItem("Exit", null, (_, _) => { Environment.Exit(0); })
				});
			}

			/// <summary>
			/// Run the trait in the current thread, this method does not return while the trait is running.
			/// </summary>
			/// <param name="options">The options to pass to <see cref="InternalSystemTrait"/>.</param>
			public static void Run(IOptions<BasicOptions> options)
			{
				using InternalSystemTrait trait = new(options);
				Application.Run(trait);
			}

			/// <inheritdoc />
			protected override void Dispose(bool disposing)
			{
				_icon.Visible = false;
				base.Dispose(disposing);
				_icon.Dispose();
			}

			/// <summary>
			/// Open kyoo's page in the user's default browser.
			/// </summary>
			private void _StartBrowser()
			{
				Process browser = new()
				{
					StartInfo = new ProcessStartInfo(_options.Value.PublicUrl.ToString())
					{
						UseShellExecute = true
					}
				};
				browser.Start();
			}
		}
	}
}