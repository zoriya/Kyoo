// Kyoo - A portable and vast media library solution.
// Copyright (c) Kyoo.
//
// See AUTHORS.md and LICENSE file in the project root for full license information.
//
// Kyoo is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// any later version.
//
// Kyoo is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Kyoo. If not, see <https://www.gnu.org/licenses/>.

using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Threading;
using System.Windows.Forms;
using Autofac;
using Kyoo.Abstractions.Controllers;
using Kyoo.Core.Models.Options;
using Microsoft.Extensions.Options;

namespace Kyoo.Host.WindowsTrait
{
	/// <summary>
	/// A singleton that add an notification icon on the window's toolbar.
	/// </summary>
	public sealed class SystemTrait : IStartable, IDisposable
	{
		/// <summary>
		/// The application running Kyoo.
		/// </summary>
		private readonly IApplication _application;

		/// <summary>
		/// The options containing the <see cref="BasicOptions.Url"/>.
		/// </summary>
		private readonly IOptions<BasicOptions> _options;

		/// <summary>
		/// The thread where the trait is running.
		/// </summary>
		private Thread _thread;

		/// <summary>
		/// Create a new <see cref="SystemTrait"/>.
		/// </summary>
		/// <param name="application">The application running Kyoo.</param>
		/// <param name="options">The options to use.</param>
		public SystemTrait(IApplication application, IOptions<BasicOptions> options)
		{
			_application = application;
			_options = options;
		}

		/// <inheritdoc />
		public void Start()
		{
			_thread = new Thread(() => InternalSystemTrait.Run(_application, _options))
			{
				IsBackground = true
			};
			_thread.Start();
		}

		/// <inheritdoc />
		public void Dispose()
		{
			Application.Exit();
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
			/// The application running Kyoo.
			/// </summary>
			private readonly IApplication _application;

			/// <summary>
			/// The options containing the <see cref="BasicOptions.Url"/>.
			/// </summary>
			private readonly IOptions<BasicOptions> _options;

			/// <summary>
			/// The Icon that is displayed in the window's bar.
			/// </summary>
			private readonly NotifyIcon _icon;

			/// <summary>
			/// Create a new <see cref="InternalSystemTrait"/>. Used only by <see cref="Run"/>.
			/// </summary>
			/// <param name="application">The application running Kyoo.</param>
			/// <param name="options">The option containing the public url.</param>
			private InternalSystemTrait(IApplication application, IOptions<BasicOptions> options)
			{
				_application = application;
				_options = options;

				AppDomain.CurrentDomain.ProcessExit += (_, _) => Dispose();
				Application.ApplicationExit += (_, _) => Dispose();

				_icon = new NotifyIcon
				{
					Text = "Kyoo",
					Icon = new Icon(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "kyoo.ico")),
					Visible = true
				};
				_icon.MouseClick += (_, e) =>
				{
					if (e.Button != MouseButtons.Left)
						return;
					_StartBrowser();
				};

				_icon.ContextMenuStrip = new ContextMenuStrip();
				_icon.ContextMenuStrip.Items.AddRange(new ToolStripItem[]
				{
					new ToolStripMenuItem("Open browser", null, (_, _) => { _StartBrowser(); }),
					new ToolStripMenuItem("Open logs", null, (_, _) => { _OpenLogs(); }),
					new ToolStripSeparator(),
					new ToolStripMenuItem("Exit", null, (_, _) => { _application.Shutdown(); })
				});
			}

			/// <summary>
			/// Run the trait in the current thread, this method does not return while the trait is running.
			/// </summary>
			/// <param name="application">The application running Kyoo.</param>
			/// <param name="options">The options to pass to <see cref="InternalSystemTrait"/>.</param>
			public static void Run(IApplication application, IOptions<BasicOptions> options)
			{
				using InternalSystemTrait trait = new(application, options);
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
					StartInfo = new ProcessStartInfo(_options.Value.Url.ToString().Replace("//*:", "//localhost:"))
					{
						UseShellExecute = true
					}
				};
				browser.Start();
			}

			/// <summary>
			/// Open the log directory in windows's explorer.
			/// </summary>
			private void _OpenLogs()
			{
				string logDir = Path.Combine(_application.GetDataDirectory(), "logs");
				Process.Start("explorer.exe", logDir);
			}
		}
	}
}
