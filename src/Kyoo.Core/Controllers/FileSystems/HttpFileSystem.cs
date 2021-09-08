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
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Attributes;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.Core.Controllers
{
	/// <summary>
	/// A <see cref="IFileSystem"/> for http/https links.
	/// </summary>
	[FileSystemMetadata(new[] { "http", "https" })]
	public class HttpFileSystem : IFileSystem
	{
		/// <summary>
		/// The http client factory used to create clients.
		/// </summary>
		private readonly IHttpClientFactory _clientFactory;

		/// <summary>
		/// Create a <see cref="HttpFileSystem"/> using the given client factory.
		/// </summary>
		/// <param name="factory">The http client factory used to create clients.</param>
		public HttpFileSystem(IHttpClientFactory factory)
		{
			_clientFactory = factory;
		}

		/// <inheritdoc />
		public IActionResult FileResult(string path, bool rangeSupport = false, string type = null)
		{
			if (path == null)
				return new NotFoundResult();
			return new HttpForwardResult(new Uri(path), rangeSupport, type);
		}

		/// <inheritdoc />
		public Task<Stream> GetReader(string path)
		{
			HttpClient client = _clientFactory.CreateClient();
			return client.GetStreamAsync(path);
		}

		/// <inheritdoc />
		public async Task<Stream> GetReader(string path, AsyncRef<string> mime)
		{
			HttpClient client = _clientFactory.CreateClient();
			HttpResponseMessage response = await client.GetAsync(path);
			response.EnsureSuccessStatusCode();
			mime.Value = response.Content.Headers.ContentType?.MediaType;
			return await response.Content.ReadAsStreamAsync();
		}

		/// <inheritdoc />
		public Task<Stream> NewFile(string path)
		{
			throw new NotSupportedException("An http filesystem is readonly, a new file can't be created.");
		}

		/// <inheritdoc />
		public Task<string> CreateDirectory(string path)
		{
			throw new NotSupportedException("An http filesystem is readonly, a directory can't be created.");
		}

		/// <inheritdoc />
		public string Combine(params string[] paths)
		{
			return Path.Combine(paths);
		}

		/// <inheritdoc />
		public Task<ICollection<string>> ListFiles(string path, SearchOption options = SearchOption.TopDirectoryOnly)
		{
			throw new NotSupportedException("Listing files is not supported on an http filesystem.");
		}

		/// <inheritdoc />
		public Task<bool> Exists(string path)
		{
			throw new NotSupportedException("Checking if a file exists is not supported on an http filesystem.");
		}

		/// <inheritdoc />
		public Task<string> GetExtraDirectory<T>(T resource)
		{
			throw new NotSupportedException("Extras can not be stored inside an http filesystem.");
		}

		/// <summary>
		/// An <see cref="IActionResult"/> to proxy an http request.
		/// </summary>
		// TODO remove this suppress message once the class has been implemented.
		[SuppressMessage("ReSharper", "NotAccessedField.Local", Justification = "Not Implemented Yet.")]
		public class HttpForwardResult : IActionResult
		{
			/// <summary>
			/// The path of the request to forward.
			/// </summary>
			private readonly Uri _path;

			/// <summary>
			/// Should the proxied result support ranges requests?
			/// </summary>
			private readonly bool _rangeSupport;

			/// <summary>
			/// If not null, override the content type of the resulting request.
			/// </summary>
			private readonly string _type;

			/// <summary>
			/// Create a new <see cref="HttpForwardResult"/>.
			/// </summary>
			/// <param name="path">The path of the request to forward.</param>
			/// <param name="rangeSupport">Should the proxied result support ranges requests?</param>
			/// <param name="type">If not null, override the content type of the resulting request.</param>
			public HttpForwardResult(Uri path, bool rangeSupport, string type = null)
			{
				_path = path;
				_rangeSupport = rangeSupport;
				_type = type;
			}

			/// <inheritdoc />
			public Task ExecuteResultAsync(ActionContext context)
			{
				// TODO implement that, example: https://github.com/twitchax/AspNetCore.Proxy/blob/14dd0f212d7abb43ca1bf8c890d5efb95db66acb/src/Core/Extensions/Http.cs#L15
				throw new NotImplementedException();
			}
		}
	}
}
