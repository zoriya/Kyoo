using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using JetBrains.Annotations;
using Kyoo.Controllers;
using Kyoo.Models;
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
		private readonly TvDbClient _client = new();

		/// <summary>
		/// The API key used to authenticate with the tvdb API.
		/// </summary>
		private readonly string _apiKey;

		/// <inheritdoc />
		public Provider Provider => new()
		{
			Slug = "the-tvdb",
			Name = "TheTVDB",
			LogoExtension = "png",
			Logo = "https://www.thetvdb.com/images/logo.png"
		};
		
		
		public ProviderTvdb(string apiKey)
		{
			_apiKey = apiKey;
		}

		private Task _Authenticate()
		{
			if (_client.Authentication.Token == null)
				return _client.Authentication.AuthenticateAsync(_apiKey);
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
				_ => throw new NotSupportedException()
			};
		}
		
		[ItemCanBeNull]
		private async Task<Show> _GetShow([NotNull] Show show)
		{
			if (!int.TryParse(show.GetID(Provider.Slug), out int id))
				return (await _SearchShow(show.Title)).FirstOrDefault();
			TvDbResponse<Series> series = await _client.Series.GetAsync(id);
			return series.Data.ToShow(Provider);
		}

		[ItemCanBeNull]
		private async Task<Episode> _GetEpisode([NotNull] Episode episode)
		{
			if (!int.TryParse(episode.Show?.GetID(Provider.Slug), out int id))
				return null;
			EpisodeQuery query = episode.AbsoluteNumber != null
				? new EpisodeQuery {AbsoluteNumber = episode.AbsoluteNumber}
				: new EpisodeQuery {AiredSeason = episode.SeasonNumber, AiredEpisode = episode.EpisodeNumber};
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
			throw new NotImplementedException();
		}
		
		[ItemNotNull]
		private async Task<ICollection<Show>> _SearchShow(string query)
		{
			TvDbResponse<SeriesSearchResult[]> shows = await _client.Search.SearchSeriesByNameAsync(query);
			return shows.Data.Select(x => x.ToShow(Provider)).ToArray();
		}

		/// <inheritdoc />
		public async Task<ICollection<PeopleRole>> GetPeople(Show show)
		{
			if (!int.TryParse(show?.GetID(Provider.Name), out int id))
				return null;
			await _Authenticate();
			TvDbResponse<Actor[]> people = await _client.Series.GetActorsAsync(id);
			return people.Data.Select(x => x.ToPeopleRole(Provider)).ToArray();
		}
	}
}