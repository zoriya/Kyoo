using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
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
		public Provider Provider { get; }
		public Task<T> Get<T>(T item) where T : class, IResource
		{
			throw new NotImplementedException();
		}

		public Task<ICollection<T>> Search<T>(string query) where T : class, IResource
		{
			throw new NotImplementedException();
		}

		public Task<ICollection<PeopleRole>> GetPeople(Show show)
		{
			throw new NotImplementedException();
		}
	}


	// public class Old
	// {
	// 	private static readonly ProviderID _provider = new()
	// 	{
	// 		Slug = "the-tvdb",
	// 		Name = "TheTVDB",
	// 		LogoExtension = "png",
	// 		Logo = "https://www.thetvdb.com/images/logo.png"
	// 	};
	// 	public ProviderID Provider => _provider;
	//
	// 	
	// 	private readonly TvDbClient _client = new();
	//
	// 	private Task Authentificate()
	// 	{
	// 		if (_client.Authentication.Token == null)
	// 			return _client.Authentication.AuthenticateAsync(APIKey);
	// 		return _client.Authentication.RefreshTokenAsync();
	// 	}
	//
	// 	public Task<Collection> GetCollectionFromName(string name)
	// 	{
	// 		return Task.FromResult<Collection>(null);
	// 	}
	//
	// 	public async Task<ICollection<Show>> SearchShows(string showName, bool isMovie)
	// 	{
	// 		await Authentificate();
	// 		
	// 		if (isMovie)
	// 			return null; //There is no movie search API for now on TheTVDB.
	// 		TvDbResponse<SeriesSearchResult[]> shows = await _client.Search.SearchSeriesAsync(showName, SearchParameter.Name);
	// 		return shows.Data.Select(x => x.ToShow(Provider)).ToArray();
	// 	}
	//
	// 	public async Task<Show> GetShowByID(Show show)
	// 	{
	// 		if (!int.TryParse(show?.GetID(Provider.Name), out int id))
	// 			return await Task.FromResult<Show>(null);
	// 		await Authentificate();
	// 		TvDbResponse<Series> serie = await _client.Series.GetAsync(id);
	// 		return serie.Data.ToShow(Provider);
	// 	}
	//
	// 	public async Task<ICollection<PeopleRole>> GetPeople(Show show)
	// 	{
	// 		if (!int.TryParse(show?.GetID(Provider.Name), out int id))
	// 			return null;
	// 		await Authentificate();
	// 		TvDbResponse<Actor[]> people = await _client.Series.GetActorsAsync(id);
	// 		return people.Data.Select(x => x.ToPeopleRole(Provider)).ToArray();
	// 	}
	//
	// 	public Task<Season> GetSeason(Show show, int seasonNumber)
	// 	{
	// 		return Task.FromResult<Season>(null);
	// 	}
	//
	// 	public async Task<Episode> GetEpisode(Show show, int seasonNumber, int episodeNumber, int absoluteNumber)
	// 	{
	// 		if (!int.TryParse(show?.GetID(Provider.Name), out int id))
	// 			return null;
	// 		await Authentificate();
	// 		TvDbResponse<EpisodeRecord[]> episodes = absoluteNumber != -1
	// 			? await _client.Series.GetEpisodesAsync(id, 0, new EpisodeQuery {AbsoluteNumber = absoluteNumber})
	// 			: await _client.Series.GetEpisodesAsync(id, 0, new EpisodeQuery {AiredSeason = seasonNumber, AiredEpisode = episodeNumber});
	// 		EpisodeRecord x = episodes.Data[0];
	//
	// 		if (absoluteNumber == -1)
	// 			absoluteNumber = x.AbsoluteNumber ?? -1;
	// 		else
	// 		{
	// 			seasonNumber = x.AiredSeason ?? -1;
	// 			episodeNumber = x.AiredEpisodeNumber ?? -1;
	// 		}
	//
	// 		return new Episode(seasonNumber,
	// 			episodeNumber,
	// 			absoluteNumber,
	// 			x.EpisodeName,
	// 			x.Overview,
	// 			DateTime.ParseExact(x.FirstAired, "yyyy-MM-dd", CultureInfo.InvariantCulture),
	// 			-1,
	// 			x.Filename != null ? "https://www.thetvdb.com/banners/" + x.Filename : null,
	// 			new []
	// 			{
	// 				new MetadataID(Provider, x.Id.ToString(), $"https://www.thetvdb.com/series/{id}/episodes/{x.Id}")
	// 			});
	// 	}
	// }

	// public static class Convertors
	// {
	// 	private static int? GetYear(string firstAired)
	// 	{
	// 		if (firstAired?.Length >= 4 && int.TryParse(firstAired.Substring(0, 4), out int year))
	// 			return year;
	// 		return null;
	// 	}
	//
	// 	private static Status? GetStatus(string status)
	// 	{
	// 		return status switch
	// 		{
	// 			"Ended" => Status.Finished,
	// 			"Continuing" => Status.Airing,
	// 			_ => null
	// 		};
	// 	}
	// 	
	// 	public static Show ToShow(this SeriesSearchResult x, ProviderID provider)
	// 	{
	// 		Show ret = new(x.Slug,
	// 			x.SeriesName,
	// 			x.Aliases,
	// 			null,
	// 			x.Overview,
	// 			null,
	// 			null,
	// 			GetStatus(x.Status),
	// 			GetYear(x.FirstAired),
	// 			null,
	// 			new[]
	// 			{
	// 				new MetadataID(provider, x.Id.ToString(), $"https://www.thetvdb.com/series/{x.Slug}")
	// 			});
	// 		if (x.Poster != null)
	// 			Utility.SetImage(ret, $"https://www.thetvdb.com{x.Poster}", ImageType.Poster);
	// 		return ret;
	// 	}
	//
	// 	public static Show ToShow(this Series x, ProviderID provider)
	// 	{
	// 		return new(x.Slug,
	// 			x.SeriesName,
	// 			x.Aliases,
	// 			null,
	// 			x.Overview,
	// 			null,
	// 			x.Genre.Select(y => new Genre(Utility.ToSlug(y), y)),
	// 			GetStatus(x.Status),
	// 			GetYear(x.FirstAired),
	// 			null,
	// 			new[]
	// 			{
	// 				new MetadataID(provider, x.Id.ToString(),$"https://www.thetvdb.com/series/{x.Slug}")
	// 			})
	// 		{
	// 			Poster = x.Poster != null ? $"https://www.thetvdb.com/banners/{x.Poster}" : null,
	// 			Backdrop = x.FanArt != null ? $"https://www.thetvdb.com/banners/{x.FanArt}" : null
	// 		};
	// 	}
	//
	// 	public static PeopleRole ToPeopleRole(this Actor x, ProviderID provider)
	// 	{
	// 		return new (Utility.ToSlug(x.Name),
	// 			x.Name,
	// 			x.Role,
	// 			null,
	// 			x.Image != null ? $"https://www.thetvdb.com/banners/{x.Image}" : null,
	// 			new[]
	// 			{
	// 				new MetadataID(provider, x.Id.ToString(), $"https://www.thetvdb.com/people/{x.Id}")
	// 			});
	// 	}
	// }
}