using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Controllers
{
	public class EpisodeRepository : LocalRepository<Episode>, IEpisodeRepository
	{
		private readonly DatabaseContext _database;
		private readonly IProviderRepository _providers;
		private readonly IShowRepository _shows;
		private readonly ISeasonRepository _seasons;
		protected override Expression<Func<Episode, object>> DefaultSort => x => x.EpisodeNumber;


		public EpisodeRepository(DatabaseContext database,
			IProviderRepository providers,
			IShowRepository shows,
			ISeasonRepository seasons)
			: base(database)
		{
			_database = database;
			_providers = providers;
			_shows = shows;
			_seasons = seasons;
		}


		public override void Dispose()
		{
			_database.Dispose();
			_providers.Dispose();
		}

		public override async ValueTask DisposeAsync()
		{
			await _database.DisposeAsync();
			await _providers.DisposeAsync();
		}

		public override Task<Episode> Get(string slug)
		{
			Match match = Regex.Match(slug, @"(?<show>.*)-s(?<season>\d*)-e(?<episode>\d*)");
			
			if (!match.Success)
				return _database.Episodes.FirstOrDefaultAsync(x => x.Show.Slug == slug);
			return Get(match.Groups["show"].Value,
				int.Parse(match.Groups["season"].Value), 
				int.Parse(match.Groups["episode"].Value));
		}
		
		public Task<Episode> Get(string showSlug, int seasonNumber, int episodeNumber)
		{
			return _database.Episodes.FirstOrDefaultAsync(x => x.Show.Slug == showSlug 
			                                                         && x.SeasonNumber == seasonNumber
			                                                         && x.EpisodeNumber == episodeNumber);
		}

		public Task<Episode> Get(int showID, int seasonNumber, int episodeNumber)
		{
			return _database.Episodes.FirstOrDefaultAsync(x => x.ShowID == showID 
			                                                   && x.SeasonNumber == seasonNumber
			                                                   && x.EpisodeNumber == episodeNumber);
		}

		public Task<Episode> Get(int seasonID, int episodeNumber)
		{
			return _database.Episodes.FirstOrDefaultAsync(x => x.SeasonID == seasonID
			                                                   && x.EpisodeNumber == episodeNumber);
		}

		public Task<Episode> GetAbsolute(int showID, int absoluteNumber)
		{
			return _database.Episodes.FirstOrDefaultAsync(x => x.ShowID == showID
			                                                   && x.AbsoluteNumber == absoluteNumber);
		}

		public Task<Episode> GetAbsolute(string showSlug, int absoluteNumber)
		{
			return _database.Episodes.FirstOrDefaultAsync(x => x.Show.Slug == showSlug
			                                                   && x.AbsoluteNumber == absoluteNumber);
		}

		public override async Task<ICollection<Episode>> Search(string query)
		{
			return await _database.Episodes
				.Where(x => EF.Functions.ILike(x.Title, $"%{query}%"))
				.Take(20)
				.ToListAsync();
		}

		public override async Task<Episode> Create(Episode obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			await Validate(obj);
			_database.Entry(obj).State = EntityState.Added;
			if (obj.ExternalIDs != null)
				foreach (MetadataID entry in obj.ExternalIDs)
					_database.Entry(entry).State = EntityState.Added;
			
			if (obj.Tracks != null)
				foreach (Track entry in obj.Tracks)
					_database.Entry(entry).State = EntityState.Added;
			
			await _database.SaveChangesAsync($"Trying to insert a duplicated episode (slug {obj.Slug} already exists).");
			return obj;
		}

		protected override async Task Validate(Episode obj)
		{
			if (obj.ShowID <= 0)
				throw new InvalidOperationException($"Can't store an episode not related to any show (showID: {obj.ShowID}).");

			if (obj.ExternalIDs != null)
			{
				foreach (MetadataID link in obj.ExternalIDs)
					link.Provider = await _providers.CreateIfNotExists(link.Provider);
			}
		}
		
		public async Task<ICollection<Episode>> GetFromShow(int showID, 
			Expression<Func<Episode, bool>> where = null, 
			Sort<Episode> sort = default, 
			Pagination limit = default)
		{
			ICollection<Episode> episodes = await ApplyFilters(_database.Episodes.Where(x => x.ShowID == showID),
				where,
				sort,
				limit);
			if (!episodes.Any() && await _shows.Get(showID) == null)
				throw new ItemNotFound();
			return episodes;
		}
		
		public async Task<ICollection<Episode>> GetFromShow(string showSlug, 
			Expression<Func<Episode, bool>> where = null, 
			Sort<Episode> sort = default, 
			Pagination limit = default)
		{
			ICollection<Episode> episodes = await ApplyFilters(_database.Episodes.Where(x => x.Show.Slug == showSlug),
				where,
				sort,
				limit);
			if (!episodes.Any() && await _shows.Get(showSlug) == null)
				throw new ItemNotFound();
			return episodes;
		}

		public async Task<ICollection<Episode>> GetFromSeason(int seasonID, 
			Expression<Func<Episode, bool>> where = null, 
			Sort<Episode> sort = default, 
			Pagination limit = default)
		{
			ICollection<Episode> episodes = await ApplyFilters(_database.Episodes.Where(x => x.SeasonID == seasonID),
				where,
				sort,
				limit);
			if (!episodes.Any() && await _seasons.Get(seasonID) == null)
				throw new ItemNotFound();
			return episodes;
		}

		public async Task<ICollection<Episode>> GetFromSeason(int showID, 
			int seasonNumber,
			Expression<Func<Episode, bool>> where = null, 
			Sort<Episode> sort = default, 
			Pagination limit = default)
		{
			ICollection<Episode> episodes = await ApplyFilters(_database.Episodes.Where(x => x.ShowID == showID
			                                                                           && x.SeasonNumber == seasonNumber),
				where,
				sort,
				limit);
			if (!episodes.Any() && await _seasons.Get(showID, seasonNumber) == null)
				throw new ItemNotFound();
			return episodes;
		}

		public async Task<ICollection<Episode>> GetFromSeason(string showSlug, 
			int seasonNumber,
			Expression<Func<Episode, bool>> where = null, 
			Sort<Episode> sort = default, 
			Pagination limit = default)
		{
			ICollection<Episode> episodes = await ApplyFilters(_database.Episodes.Where(x => x.Show.Slug == showSlug
			                                                                                 && x.SeasonNumber == seasonNumber),
				where,
				sort,
				limit);
			if (!episodes.Any() && await _seasons.Get(showSlug, seasonNumber) == null)
				throw new ItemNotFound();
			return episodes;
		}

		public async Task Delete(string showSlug, int seasonNumber, int episodeNumber)
		{
			Episode obj = await Get(showSlug, seasonNumber, episodeNumber);
			await Delete(obj);
		}

		public override async Task Delete(Episode obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			_database.Entry(obj).State = EntityState.Deleted;
			if (obj.ExternalIDs != null)
				foreach (MetadataID entry in obj.ExternalIDs)
					_database.Entry(entry).State = EntityState.Deleted;
			// Since Tracks & Episodes are on the same database and handled by dotnet-ef, we can't use the repository to delete them. 
			await _database.SaveChangesAsync();
		}
	}
}