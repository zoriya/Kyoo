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

using System.Threading.Tasks;
using Autofac;
using Kyoo.Core;

namespace Kyoo.Host.WindowsTrait
{
	public static class Program
	{
		/// <summary>
		/// The string representation of the environment used in IWebHostEnvironment.
		/// </summary>
#if DEBUG
		private const string Environment = "Development";
#else
		private const string Environment = "Production";
#endif

		/// <summary>
		/// The main entry point for the application that overrides the default host.
		/// It adds a system trait for windows and since the host is build as a windows executable instead of a console
		/// app, the console is not showed.
		/// </summary>
		/// <param name="args">Command line arguments</param>
		/// <returns>A <see cref="Task"/> representing the lifetime of the program.</returns>
		public static Task Main(string[] args)
		{
			Application application = new(Environment);
			return application.Start(args, builder =>
			{
				builder.RegisterType<SystemTrait>().As<IStartable>().SingleInstance();
			});
		}
	}
}
