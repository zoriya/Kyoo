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
using Kyoo.Abstractions.Models.Exceptions;
using Kyoo.Abstractions.Models.Utils;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Logging;

namespace Kyoo.Core
{
	/// <summary>
	/// A middleware to handle errors globally.
	/// </summary>
	public class ExceptionFilter : IExceptionFilter
	{
		private readonly ILogger _logger;

		/// <summary>
		/// Initializes a new instance of the <see cref="ExceptionFilter"/> class.
		/// </summary>
		/// <param name="logger">The logger used to log errors.</param>
		public ExceptionFilter(ILogger<ExceptionFilter> logger)
		{
			_logger = logger;
		}

		/// <inheritdoc/>
		public void OnException(ExceptionContext context)
		{
			switch (context.Exception)
			{
				case ArgumentException ex:
					context.Result = new BadRequestObjectResult(new RequestError(ex.Message));
					break;
				case ItemNotFoundException ex:
					context.Result = new NotFoundObjectResult(new RequestError(ex.Message));
					break;
				case DuplicatedItemException ex:
					context.Result = new ConflictObjectResult(ex.Existing);
					break;
				case Exception ex:
					_logger.LogError("Unhandled error", ex);
					context.Result = new ServerErrorObjectResult(new RequestError("Internal Server Error"));
					break;
			}
		}
	}

	/// <inheritdoc />
	public class ServerErrorObjectResult : ObjectResult
	{
		/// <summary>
		/// Initializes a new instance of the <see cref="ServerErrorObjectResult"/> class.
		/// </summary>
		/// <param name="value">The object to return.</param>
		public ServerErrorObjectResult(object value)
			: base(value)
		{
			StatusCode = StatusCodes.Status500InternalServerError;
		}
	}
}
