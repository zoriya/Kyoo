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
		private bool _disposed;
		private readonly DatabaseContext _database;
		private readonly IProviderRepository _providers;
		protected override Expression<Func<Episode, object>> DefaultSort => x => x.EpisodeNumber;


		public EpisodeRepository(DatabaseContext database, IProviderRepository providers) : base(database)
		{
			_database = database;
			_providers = providers;
		}


		public override void Dispose()
		{
			if (_disposed)
				return;
			_disposed = true;
			_database.Dispose();
			_providers.Dispose();
		}

		public override async ValueTask DisposeAsync()
		{
			if (_disposed)
				return;
			_disposed = true;
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
			await base.Create(obj);
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

		protected override async Task Validate(Episode resource)
		{
			if (resource.ShowID <= 0)
				throw new InvalidOperationException($"Can't store an episode not related to any show (showID: {resource.ShowID}).");

			await base.Validate(resource);

			if (resource.ExternalIDs != null)
			{
				foreach (MetadataID link in resource.ExternalIDs)
					if (ShouldValidate(link))
						link.Provider = await _providers.CreateIfNotExists(link.Provider, true);
			}
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