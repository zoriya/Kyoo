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
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Postgresql;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Core.Controllers;

public class WatchItemsRepository : IWatchItemsRepository
{
	private readonly DatabaseContext _database;

	public WatchItemsRepository(DatabaseContext database)
	{
		_database = database;
	}

	/// <inheritdoc />
	public Task<MovieWatchStatus?> GetMovieStatus(Expression<Func<Movie, bool>> where, int userId)
	{
		return _database.MovieWatchInfo.FirstOrDefaultAsync(x =>
			x.Movie == _database.Movies.FirstOrDefault(where)
			&& x.UserId == userId
		);
	}

	/// <inheritdoc />
	public async Task<MovieWatchStatus> SetMovieStatus(
		int movieId,
		int userId,
		WatchStatus status,
		int? watchedTime)
	{
		if (watchedTime.HasValue && status != WatchStatus.Watching)
			throw new ValidationException("Can't have a watched time if the status is not watching.");
		MovieWatchStatus ret = new()
		{
			UserId = userId,
			MovieId = movieId,
			Status = status,
			WatchedTime = watchedTime,
		};
		await _database.MovieWatchInfo.Upsert(ret).RunAsync();
		return ret;
	}
}
