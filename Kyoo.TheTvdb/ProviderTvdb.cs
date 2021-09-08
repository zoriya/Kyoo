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
using System.Linq;
using System.Threading.Tasks;
using JetBrains.Annotations;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.TheTvdb.Models;
using Microsoft.Extensions.Options;
using TvDbSharper;
using TvDbSharper.Dto;

namespace Kyoo.TheTvdb
{
	/// <summary>
	/// A metadata provider for The TVDB.
	/// </summary>
	public class ProviderTvdb : IMetadataProvider
	{
		/// <summary>
		/// The internal tvdb client used to make requests.
		/// </summary>
		private readonly ITvDbClient _client;

		/// <summary>
		/// The API key used to authenticate with the tvdb API.
		/// </summary>
		private readonly IOptions<TvdbOption> _apiKey;

		/// <inheritdoc />
		public Provider Provider => new()
		{
			Slug = "the-tvdb",
			Name = "TheTVDB",
			Images = new Dictionary<int, string>
			{
				[Images.Logo] = "https://www.thetvdb.com/images/logo.png"
			}
		};

		/// <summary>
		/// Create a new <see cref="ProviderTvdb"/> using a tvdb client and an api key.
		/// </summary>
		/// <param name="client">The tvdb client to use</param>
		/// <param name="apiKey">The api key</param>
		public ProviderTvdb(ITvDbClient client, IOptions<TvdbOption> apiKey)
		{
			_client = client;
			_apiKey = apiKey;
		}

		/// <summary>
		/// Authenticate and refresh the token of the tvdb client.
		/// </summary>
		private Task _Authenticate()
		{
			if (_client.Authentication.Token == null)
				return _client.Authentication.AuthenticateAsync(_apiKey.Value.ApiKey);
			return _client.Authentication.RefreshTokenAsync();
		}

		/// <inheritdoc />
		public async Task<T> Get<T>(T item)
			where T : class, IResource
		{
			await _Authenticate();
			return item switch
			{
				Show show => await _GetShow(show) as T,
				Episode episode => await _GetEpisode(episode) as T,
				_ => null
			};
		}

		/// <summary>
		/// Retrieve metadata about a show.
		/// </summary>
		/// <param name="show">The base show to retrieve metadata for.</param>
		/// <returns>A new show filled with metadata from the tvdb.</returns>
		[ItemCanBeNull]
		private async Task<Show> _GetShow([NotNull] Show show)
		{
			if (show.IsMovie)
				return null;

			if (!int.TryParse(show.GetID(Provider.Slug), out int id))
			{
				Show found = (await _SearchShow(show.Title)).FirstOrDefault();
				if (found == null)
					return null;
				return await Get(found);
			}
			TvDbResponse<Series> series = await _client.Series.GetAsync(id);
			Show ret = series.Data.ToShow(Provider);

			TvDbResponse<Actor[]> people = await _client.Series.GetActorsAsync(id);
			ret.People = people.Data.Select(x => x.ToPeopleRole()).ToArray();
			return ret;
		}

		/// <summary>
		/// Retrieve metadata about an episode.
		/// </summary>
		/// <param name="episode">The base episode to retrieve metadata for.</param>
		/// <returns>A new episode filled with metadata from the tvdb.</returns>
		[ItemCanBeNull]
		private async Task<Episode> _GetEpisode([NotNull] Episode episode)
		{
			if (!int.TryParse(episode.Show?.GetID(Provider.Slug), out int id))
				return null;
			EpisodeQuery query = episode.AbsoluteNumber != null
				? new EpisodeQuery { AbsoluteNumber = episode.AbsoluteNumber }
				: new EpisodeQuery { AiredSeason = episode.SeasonNumber, AiredEpisode = episode.EpisodeNumber };
			TvDbResponse<EpisodeRecord[]> episodes = await _client.Series.GetEpisodesAsync(id, 0, query);
			return episodes.Data.FirstOrDefault()?.ToEpisode(Provider);
		}

		/// <inheritdoc />
		public async Task<ICollection<T>> Search<T>(string query)
			where T : class, IResource
		{
			await _Authenticate();
			if (typeof(T) == typeof(Show))
				return (await _SearchShow(query) as ICollection<T>)!;
			return ArraySegment<T>.Empty;
		}

		/// <summary>
		/// Search for shows in the tvdb.
		/// </summary>
		/// <param name="query">The query to ask the tvdb about.</param>
		/// <returns>A list of shows that could be found on the tvdb.</returns>
		[ItemNotNull]
		private async Task<ICollection<Show>> _SearchShow(string query)
		{
			try
			{
				TvDbResponse<SeriesSearchResult[]> shows = await _client.Search.SearchSeriesByNameAsync(query);
				return shows.Data.Select(x => x.ToShow(Provider)).ToArray();
			}
			catch (TvDbServerException)
			{
				return ArraySegment<Show>.Empty;
			}
		}
	}
}
